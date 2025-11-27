// Storage service - handles configuration persistence using tauri-plugin-store

use crate::models::AppConfig;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

pub struct StorageService;

impl StorageService {
    /// Saves application configuration to persistent storage
    pub fn save_config(app: &AppHandle, config: &AppConfig) -> Result<(), String> {
        let store = app
            .store("config.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;

        store.set("llm_config", serde_json::to_value(config).unwrap());
        store
            .save()
            .map_err(|e| format!("Failed to save config: {}", e))?;

        Ok(())
    }

    /// Loads application configuration from persistent storage
    pub fn load_config(app: &AppHandle) -> Result<AppConfig, String> {
        let store = app
            .store("config.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;

        if let Some(value) = store.get("llm_config") {
            serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to deserialize config: {}", e))
        } else {
            // Return default config if not found
            Ok(AppConfig::default())
        }
    }

    /// Validates configuration before saving
    pub fn validate_config(config: &AppConfig) -> Result<(), String> {
        config.llm_provider.validate()
    }

    // Note: API key encryption methods deferred to M5
    // For M3, API keys are stored in plain text within the config
}
