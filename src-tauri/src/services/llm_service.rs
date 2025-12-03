// LLM 服务：负责与各模型交互并支持流式输出

use crate::models::{LLMProvider, ProxyConfig};
use anyhow::Result;
use futures::StreamExt;
use reqwest::Client;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};

pub struct LLMService {
    client: Client,
    provider: LLMProvider,
}

impl LLMService {
    pub fn new(provider: LLMProvider, proxy_config: Option<ProxyConfig>) -> Self {
        let mut client_builder = Client::builder()
            .timeout(std::time::Duration::from_secs(90)); // 设置 90 秒超时

        // M5：如有代理配置则套用
        if let Some(proxy_cfg) = proxy_config {
            if let Some(proxy_url) = proxy_cfg.get_https_proxy() {
                if let Ok(proxy) = reqwest::Proxy::https(&proxy_url) {
                    client_builder = client_builder.proxy(proxy);
                    println!("✅ HTTPS proxy configured: {}", proxy_url);
                } else {
                    eprintln!("⚠️ Invalid proxy URL: {}", proxy_url);
                }
            }
        }

        let client = client_builder
            .build()
            .expect("Failed to create HTTP client");

        Self { client, provider }
    }

    /// 通过 LLM 生成报告并返回流式内容
    pub async fn generate_report_streaming(
        &self,
        prompt: String,
        app: AppHandle,
    ) -> Result<String, String> {
        self.generate_report_streaming_with_template(prompt, "default".to_string(), app)
            .await
    }

    /// 基于模板 ID 生成报告（目前仅为兼容，未实际使用）
    pub async fn generate_report_streaming_with_template(
        &self,
        prompt: String,
        _template_id: String,
        app: AppHandle,
    ) -> Result<String, String> {
        let content = match &self.provider {
            LLMProvider::OpenAI {
                base_url,
                api_key,
                model,
            } => {
                self.generate_openai_streaming(base_url, api_key, model, prompt, app.clone())
                    .await?
            }
            LLMProvider::Claude {
                base_url,
                api_key,
                model,
            } => {
                self.generate_claude_streaming(base_url, api_key, model, prompt, app.clone())
                    .await?
            }
            LLMProvider::Gemini {
                base_url,
                api_key,
                model,
            } => {
                self.generate_gemini_streaming(base_url, api_key, model, prompt, app.clone())
                    .await?
            }
        };
        Ok(content)
    }

    /// OpenAI 兼容接口（OpenAI、DeepSeek 及本地模型等）
    async fn generate_openai_streaming(
        &self,
        base_url: &str,
        api_key: &str,
        model: &str,
        prompt: String,
        app: AppHandle,
    ) -> Result<String, String> {
        let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));
        let body = json!({
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "stream": true
        });


        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("API error {}: {}", status, error_text));
        }

        let mut stream = response.bytes_stream();
        let mut full_content = String::new();
        let mut buffer = String::new();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
            let text = String::from_utf8_lossy(&chunk);
            buffer.push_str(&text);

            // 解析完整的 SSE 消息（data: {...}\n\n）
            while let Some(pos) = buffer.find("\n\n") {
                let message = buffer[..pos].to_string();
                buffer = buffer[pos + 2..].to_string();

                for line in message.lines() {
                    if let Some(json_str) = line.strip_prefix("data: ") {
                        if json_str.trim() == "[DONE]" {
                            continue;
                        }

                        if let Ok(data) = serde_json::from_str::<Value>(json_str) {
                            if let Some(content) = data["choices"][0]["delta"]["content"].as_str() {
                                full_content.push_str(content);

                                // 发送进度事件
                                let _ = app.emit("report-generation-progress", content);
                            }
                        }
                    }
                }
            }
        }

        if full_content.is_empty() {
            return Err("No content generated from LLM".to_string());
        }

        Ok(full_content)
    }

    /// Claude API（Anthropic）
    async fn generate_claude_streaming(
        &self,
        base_url: &str,
        api_key: &str,
        model: &str,
        prompt: String,
        app: AppHandle,
    ) -> Result<String, String> {
        let url = format!("{}/v1/messages", base_url.trim_end_matches('/'));
        let body = json!({
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 4096,
            "stream": true
        });

        let response = self
            .client
            .post(&url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("API error {}: {}", status, error_text));
        }

        let mut stream = response.bytes_stream();
        let mut full_content = String::new();
        let mut buffer = String::new();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
            let text = String::from_utf8_lossy(&chunk);
            buffer.push_str(&text);

            // 解析完整 SSE 消息
            while let Some(pos) = buffer.find("\n\n") {
                let message = buffer[..pos].to_string();
                buffer = buffer[pos + 2..].to_string();

                for line in message.lines() {
                    if let Some(json_str) = line.strip_prefix("data: ") {
                        if let Ok(data) = serde_json::from_str::<Value>(json_str) {
                            // Claude 数据格式：{"type":"content_block_delta","delta":{"type":"text_delta","text":"..."}}
                            if data["type"] == "content_block_delta" {
                                if let Some(text) = data["delta"]["text"].as_str() {
                                    full_content.push_str(text);
                                    let _ = app.emit("report-generation-progress", text);
                                }
                            }
                        }
                    }
                }
            }
        }

        if full_content.is_empty() {
            return Err("No content generated from LLM".to_string());
        }

        Ok(full_content)
    }

    /// Gemini API（Google）
    async fn generate_gemini_streaming(
        &self,
        base_url: &str,
        api_key: &str,
        model: &str,
        prompt: String,
        app: AppHandle,
    ) -> Result<String, String> {
        // Gemini 使用 {base_url}/models/{model}:streamGenerateContent?key={api_key} URL 结构
        let url = format!(
            "{}/models/{}:streamGenerateContent?key={}",
            base_url.trim_end_matches('/'),
            model,
            api_key
        );

        let body = json!({
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        });

        let response = self
            .client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("API error {}: {}", status, error_text));
        }

        let mut stream = response.bytes_stream();
        let mut full_content = String::new();
        let mut buffer = String::new();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
            let text = String::from_utf8_lossy(&chunk);
            buffer.push_str(&text);

            // Gemini 以换行分隔的 JSON 流推送
            while let Some(pos) = buffer.find('\n') {
                let line = buffer[..pos].trim().to_string();
                buffer = buffer[pos + 1..].to_string();

                if line.is_empty() {
                    continue;
                }

                if let Ok(data) = serde_json::from_str::<Value>(&line) {
                    // Gemini 数据格式示例：{"candidates":[{"content":{"parts":[{"text":"..."}]}}]}
                    if let Some(candidates) = data["candidates"].as_array() {
                        if let Some(first_candidate) = candidates.first() {
                            if let Some(parts) = first_candidate["content"]["parts"].as_array() {
                                for part in parts {
                                    if let Some(text) = part["text"].as_str() {
                                        full_content.push_str(text);
                                        let _ = app.emit("report-generation-progress", text);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if full_content.is_empty() {
            return Err("No content generated from LLM".to_string());
        }

        Ok(full_content)
    }

    /// 通过简单请求测试连接（非流式）
    pub async fn test_connection(&self) -> Result<bool, String> {
        match &self.provider {
            LLMProvider::OpenAI {
                base_url,
                api_key,
                model,
            } => self.test_openai_connection(base_url, api_key, model).await,
            LLMProvider::Claude {
                base_url,
                api_key,
                model,
            } => self.test_claude_connection(base_url, api_key, model).await,
            LLMProvider::Gemini {
                base_url,
                api_key,
                model,
            } => self.test_gemini_connection(base_url, api_key, model).await,
        }
    }

    async fn test_openai_connection(
        &self,
        base_url: &str,
        api_key: &str,
        model: &str,
    ) -> Result<bool, String> {
        let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));
        let body = json!({
            "model": model,
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 5
        });

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Connection test failed: {}", e))?;

        Ok(response.status().is_success())
    }

    async fn test_claude_connection(
        &self,
        base_url: &str,
        api_key: &str,
        model: &str,
    ) -> Result<bool, String> {
        let url = format!("{}/v1/messages", base_url.trim_end_matches('/'));
        let body = json!({
            "model": model,
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 5
        });

        let response = self
            .client
            .post(&url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Connection test failed: {}", e))?;

        Ok(response.status().is_success())
    }

    async fn test_gemini_connection(
        &self,
        base_url: &str,
        api_key: &str,
        model: &str,
    ) -> Result<bool, String> {
        let url = format!(
            "{}/models/{}:generateContent?key={}",
            base_url.trim_end_matches('/'),
            model,
            api_key
        );

        let body = json!({
            "contents": [{
                "parts": [{"text": "test"}]
            }]
        });

        let response = self
            .client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Connection test failed: {}", e))?;

        Ok(response.status().is_success())
    }
}
