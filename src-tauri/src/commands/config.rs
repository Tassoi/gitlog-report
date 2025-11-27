// Configuration-related Tauri commands

use crate::models::AppConfig;
use crate::services::storage_service::StorageService;
use tauri::AppHandle;

#[tauri::command]
pub async fn save_config(config: AppConfig, app: AppHandle) -> Result<(), String> {
    // Validate config before saving
    StorageService::validate_config(&config)?;

    // Save to persistent storage
    StorageService::save_config(&app, &config)?;

    Ok(())
}

#[tauri::command]
pub async fn load_config(app: AppHandle) -> Result<AppConfig, String> {
    // Load from persistent storage (returns default if not found)
    StorageService::load_config(&app)
}

#[tauri::command]
pub async fn save_api_key(key: String) -> Result<(), String> {
    // Basic validation for M3 (full keyring integration in M5)
    if key.is_empty() {
        return Err("API key cannot be empty".to_string());
    }
    Ok(())
}
