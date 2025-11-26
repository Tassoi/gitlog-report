// Configuration-related Tauri commands

use crate::models::{AppConfig, ExportFormat, LLMConfig, LLMProvider};
use std::sync::Mutex;

// In-memory config storage for M1
lazy_static::lazy_static! {
    static ref CONFIG_STORE: Mutex<Option<AppConfig>> = Mutex::new(None);
}

#[tauri::command]
pub async fn save_config(config: AppConfig) -> Result<(), String> {
    let mut store = CONFIG_STORE.lock().map_err(|e| e.to_string())?;
    *store = Some(config);
    Ok(())
}

#[tauri::command]
pub async fn load_config() -> Result<AppConfig, String> {
    let store = CONFIG_STORE.lock().map_err(|e| e.to_string())?;

    // Return stored config or default mock config
    Ok(store.clone().unwrap_or_else(|| AppConfig {
        llm: LLMConfig {
            provider: LLMProvider::OpenAI {
                api_key: String::new(),
                base_url: "https://api.openai.com/v1".to_string(),
            },
        },
        export_format: ExportFormat::Markdown,
        timezone: "UTC".to_string(),
    }))
}

#[tauri::command]
pub async fn save_api_key(key: String) -> Result<(), String> {
    // Mock implementation for M1 - just validate not empty
    if key.is_empty() {
        return Err("API key cannot be empty".to_string());
    }
    Ok(())
}
