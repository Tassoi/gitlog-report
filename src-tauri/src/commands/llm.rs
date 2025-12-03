// LLM 相关 Tauri 命令

use crate::models::LLMProvider;
use crate::services::{llm_service::LLMService, storage_service::StorageService};
use tauri::AppHandle;

#[tauri::command]
pub async fn configure_llm(provider: LLMProvider, app: AppHandle) -> Result<(), String> {
    // 校验提供商配置
    provider.validate()?;

    // 从存储配置中读取代理设置（M5）
    let config = StorageService::load_config(&app)?;

    // 注意：真实存储由 config.rs 中的 save_config 命令处理
    // 此命令仅校验提供商是否可被实例化
    let _llm_service = LLMService::new(provider, Some(config.proxy_config));
    Ok(())
}

#[tauri::command]
pub async fn test_llm_connection(provider: LLMProvider, app: AppHandle) -> Result<bool, String> {
    // 校验提供商配置
    provider.validate()?;

    // 从存储配置中读取代理设置（M5）
    let config = StorageService::load_config(&app)?;

    // 创建 LLM 服务并测试连接
    let llm_service = LLMService::new(provider, Some(config.proxy_config));
    llm_service.test_connection().await?;

    Ok(true)
}
