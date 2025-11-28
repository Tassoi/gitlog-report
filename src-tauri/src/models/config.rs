// Configuration data models

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum LLMProvider {
    #[serde(rename = "openai")]
    OpenAI {
        #[serde(rename = "base_url")]
        base_url: String,
        #[serde(rename = "api_key")]
        api_key: String,
        model: String,
    },
    #[serde(rename = "claude")]
    Claude {
        #[serde(rename = "base_url")]
        base_url: String,
        #[serde(rename = "api_key")]
        api_key: String,
        model: String,
    },
    #[serde(rename = "gemini")]
    Gemini {
        #[serde(rename = "base_url")]
        base_url: String,
        #[serde(rename = "api_key")]
        api_key: String,
        model: String,
    },
}

impl LLMProvider {
    pub fn validate(&self) -> Result<(), String> {
        match self {
            Self::OpenAI { api_key, model, .. }
            | Self::Claude { api_key, model, .. }
            | Self::Gemini { api_key, model, .. } => {
                if api_key.is_empty() {
                    return Err("API key cannot be empty".to_string());
                }
                if model.is_empty() {
                    return Err("Model name cannot be empty".to_string());
                }
                Ok(())
            }
        }
    }

    /// 获取提供商类型（用于 keyring entry 命名）
    pub fn get_type(&self) -> String {
        match self {
            Self::OpenAI { .. } => "openai".to_string(),
            Self::Claude { .. } => "claude".to_string(),
            Self::Gemini { .. } => "gemini".to_string(),
        }
    }

    /// 提取 API Key
    pub fn take_api_key(&mut self) -> Option<String> {
        match self {
            Self::OpenAI { api_key, .. }
            | Self::Claude { api_key, .. }
            | Self::Gemini { api_key, .. } => {
                let key = api_key.clone();
                *api_key = String::new(); // 清空
                if key.is_empty() {
                    None
                } else {
                    Some(key)
                }
            }
        }
    }

    /// 设置 API Key
    pub fn set_api_key(&mut self, new_key: String) {
        match self {
            Self::OpenAI { api_key, .. }
            | Self::Claude { api_key, .. }
            | Self::Gemini { api_key, .. } => {
                *api_key = new_key;
            }
        }
    }

    pub fn default_openai() -> Self {
        Self::OpenAI {
            base_url: "https://api.openai.com/v1".to_string(),
            api_key: String::new(),
            model: "gpt-3.5-turbo".to_string(),
        }
    }

    pub fn default_claude() -> Self {
        Self::Claude {
            base_url: "https://api.anthropic.com".to_string(),
            api_key: String::new(),
            model: "claude-3-5-sonnet-20241022".to_string(),
        }
    }

    pub fn default_gemini() -> Self {
        Self::Gemini {
            base_url: "https://generativelanguage.googleapis.com/v1beta".to_string(),
            api_key: String::new(),
            model: "gemini-1.5-pro".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMConfig {
    pub provider: LLMProvider,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Markdown,
    Html,
    Pdf,
}

// M5: Proxy configuration
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ProxyConfig {
    pub enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub http_proxy: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub https_proxy: Option<String>,
}

impl ProxyConfig {
    /// 获取 HTTPS 代理 URL（优先 UI 配置 > 环境变量）
    pub fn get_https_proxy(&self) -> Option<String> {
        if !self.enabled {
            return None;
        }

        // 1. UI 配置
        if let Some(proxy) = &self.https_proxy {
            if !proxy.is_empty() {
                return Some(proxy.clone());
            }
        }

        // 2. 环境变量
        std::env::var("HTTPS_PROXY")
            .ok()
            .or_else(|| std::env::var("https_proxy").ok())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(rename = "llm_provider")]
    pub llm_provider: LLMProvider,
    #[serde(rename = "exportFormat")]
    pub export_format: ExportFormat,
    pub timezone: String,
    #[serde(default)]
    pub proxy_config: ProxyConfig,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            llm_provider: LLMProvider::default_openai(),
            export_format: ExportFormat::Markdown,
            timezone: "UTC".to_string(),
            proxy_config: ProxyConfig::default(),
        }
    }
}
