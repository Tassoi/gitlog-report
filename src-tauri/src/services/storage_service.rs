// 存储服务：基于 tauri-plugin-store 持久化配置

use crate::models::AppConfig;
use crate::services::EncryptionService;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

pub struct StorageService;

impl StorageService {
    /// 保存应用配置到持久化存储
    /// 保存前使用 AES-256-GCM 加密 API Key
    pub fn save_config(app: &AppHandle, config: &AppConfig) -> Result<(), String> {
        let store = app
            .store("config.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;

        // 克隆配置并在存在时加密 API Key
        let mut config_to_save = config.clone();

        if let Some(api_key) = config_to_save.llm_provider.take_api_key() {
            if !api_key.is_empty() {
                // 加密 API Key
                let encrypted_key = EncryptionService::encrypt(&api_key)?;
                config_to_save.llm_provider.set_api_key(encrypted_key);
            }
        }

        // 将加密后的配置写入文件
        store.set("llm_config", serde_json::to_value(&config_to_save).unwrap());
        store
            .save()
            .map_err(|e| format!("Failed to save config: {}", e))?;

        Ok(())
    }

    /// 从持久化存储加载应用配置
    /// 返回前对加密的 API Key 进行解密
    pub fn load_config(app: &AppHandle) -> Result<AppConfig, String> {
        let store = app
            .store("config.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;

        let mut config = if let Some(value) = store.get("llm_config") {
            serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to deserialize config: {}", e))?
        } else {
            // 若不存在则返回默认配置
            AppConfig::default()
        };

        // 若存在 API Key 则尝试解密
        if let Some(encrypted_key) = config.llm_provider.take_api_key() {
            if !encrypted_key.is_empty() {
                // 尝试解密，若失败可能表示旧版本明文
                match EncryptionService::decrypt(&encrypted_key) {
                    Ok(decrypted_key) => {
                        config.llm_provider.set_api_key(decrypted_key);
                    }
                    Err(_) => {
                        // 解密失败则视为明文（旧格式）
                        // 保留原值，下一次保存时会被重新加密
                        config.llm_provider.set_api_key(encrypted_key);
                    }
                }
            }
        }

        Ok(config)
    }

    /// 保存前校验配置
    pub fn validate_config(config: &AppConfig) -> Result<(), String> {
        config.llm_provider.validate()
    }
}
