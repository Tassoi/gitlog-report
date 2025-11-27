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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(rename = "llm_provider")]
    pub llm_provider: LLMProvider,
    #[serde(rename = "exportFormat")]
    pub export_format: ExportFormat,
    pub timezone: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            llm_provider: LLMProvider::default_openai(),
            export_format: ExportFormat::Markdown,
            timezone: "UTC".to_string(),
        }
    }
}
