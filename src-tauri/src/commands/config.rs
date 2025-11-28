// Configuration-related Tauri commands

use crate::models::AppConfig;
use crate::services::StorageService;
use tauri::AppHandle;

#[tauri::command]
pub async fn save_config(config: AppConfig, app: AppHandle) -> Result<(), String> {
    // Validate config before saving
    StorageService::validate_config(&config)?;

    // Save to persistent storage (API Keys are encrypted automatically)
    StorageService::save_config(&app, &config)?;

    Ok(())
}

#[tauri::command]
pub async fn load_config(app: AppHandle) -> Result<AppConfig, String> {
    // Load from persistent storage (API Keys are decrypted automatically)
    StorageService::load_config(&app)
}

#[tauri::command]
pub async fn test_proxy(proxy_url: Option<String>) -> Result<String, String> {
    let client_builder = reqwest::Client::builder().timeout(std::time::Duration::from_secs(10));

    let client = if let Some(url) = proxy_url {
        let proxy = reqwest::Proxy::all(&url).map_err(|e| format!("Invalid proxy URL: {}", e))?;
        client_builder.proxy(proxy).build()
    } else {
        client_builder.build()
    }.map_err(|e| format!("Failed to create client: {}", e))?;

    let response = client
        .get("https://www.google.com")
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if response.status().is_success() {
        Ok(format!("代理连接成功 (状态码: {})", response.status()))
    } else {
        Err(format!("连接失败 (状态码: {})", response.status()))
    }
}
