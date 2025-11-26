// Configuration data models

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "provider", rename_all = "lowercase")]
pub enum LLMProvider {
    #[serde(rename = "openai")]
    OpenAI {
        #[serde(rename = "apiKey")]
        api_key: String,
        #[serde(rename = "baseUrl")]
        base_url: String,
    },
    #[serde(rename = "deepseek")]
    DeepSeek {
        #[serde(rename = "apiKey")]
        api_key: String,
    },
    #[serde(rename = "local")]
    Local {
        #[serde(rename = "modelPath")]
        model_path: String,
    },
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub llm: LLMConfig,
    #[serde(rename = "exportFormat")]
    pub export_format: ExportFormat,
    pub timezone: String,
}
