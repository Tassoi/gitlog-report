// LLM-related Tauri commands

use crate::models::LLMProvider;
use crate::services::llm_service::LLMService;

#[tauri::command]
pub async fn configure_llm(provider: LLMProvider) -> Result<(), String> {
    // Validate provider configuration
    provider.validate()?;

    // Note: Actual storage is handled by save_config command in config.rs
    // This command just validates the provider can be instantiated
    let _llm_service = LLMService::new(provider);
    Ok(())
}

#[tauri::command]
pub async fn test_llm_connection(provider: LLMProvider) -> Result<bool, String> {
    // Validate provider configuration
    provider.validate()?;

    // Create LLM service and test connection
    let llm_service = LLMService::new(provider);
    llm_service.test_connection().await?;

    Ok(true)
}
