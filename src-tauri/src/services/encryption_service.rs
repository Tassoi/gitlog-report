// 本地 AES-256-GCM 加密服务，用于保护 API Key
// 加密密钥由机器 ID 与应用标识推导而来

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose, Engine as _};
use rand::Rng;
use sha2::{Digest, Sha256};

const APP_IDENTIFIER: &str = "com.hkdev.gitlog-ai-reporter";
const NONCE_SIZE: usize = 12; // GCM 规范要求 96 位

pub struct EncryptionService;

impl EncryptionService {
    /// 加密字符串并返回 base64（包含随机 nonce 与密文）
    pub fn encrypt(plaintext: &str) -> Result<String, String> {
        let key = Self::get_encryption_key()?;
        let cipher = Aes256Gcm::new(&key);

        // 生成随机 nonce
        let mut rng = rand::thread_rng();
        let nonce_bytes: [u8; NONCE_SIZE] = rng.gen();
        let nonce = Nonce::from_slice(&nonce_bytes);

        // 执行加密
        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| format!("Encryption failed: {}", e))?;

        // 合并 nonce 与密文并编码为 base64
        let mut combined = nonce_bytes.to_vec();
        combined.extend_from_slice(&ciphertext);
        Ok(general_purpose::STANDARD.encode(&combined))
    }

    /// 解密 base64 串（包含 nonce 与密文）
    pub fn decrypt(encrypted: &str) -> Result<String, String> {
        let key = Self::get_encryption_key()?;
        let cipher = Aes256Gcm::new(&key);

        // 解码 base64
        let combined = general_purpose::STANDARD
            .decode(encrypted)
            .map_err(|e| format!("Base64 decode failed: {}", e))?;

        if combined.len() < NONCE_SIZE {
            return Err("Invalid encrypted data".to_string());
        }

        // 拆分 nonce 与密文
        let (nonce_bytes, ciphertext) = combined.split_at(NONCE_SIZE);
        let nonce = Nonce::from_slice(nonce_bytes);

        // 执行解密
        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| format!("Decryption failed: {}", e))?;

        String::from_utf8(plaintext).map_err(|e| format!("UTF-8 decode failed: {}", e))
    }

    /// 基于机器 UUID 与应用标识推导 256 位密钥
    fn get_encryption_key() -> Result<aes_gcm::Key<Aes256Gcm>, String> {
        let machine_id = Self::get_machine_id()?;

        // 使用 SHA-256(machine_id + app_identifier) 推导密钥
        let mut hasher = Sha256::new();
        hasher.update(machine_id.as_bytes());
        hasher.update(APP_IDENTIFIER.as_bytes());
        let key_bytes = hasher.finalize();

        Ok(aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes).clone())
    }

    /// 获取唯一机器标识
    fn get_machine_id() -> Result<String, String> {
        // 使用 machine-uid crate 获取跨平台机器 ID
        machine_uid::get().map_err(|e| format!("Failed to get machine ID: {}", e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let plaintext = "sk-1234567890abcdef";
        let encrypted = EncryptionService::encrypt(plaintext).unwrap();
        let decrypted = EncryptionService::decrypt(&encrypted).unwrap();
        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_different_nonces() {
        let plaintext = "test-key";
        let encrypted1 = EncryptionService::encrypt(plaintext).unwrap();
        let encrypted2 = EncryptionService::encrypt(plaintext).unwrap();
        // 不同 nonce 应生成不同密文
        assert_ne!(encrypted1, encrypted2);
        // 但都应还原为相同明文
        assert_eq!(
            EncryptionService::decrypt(&encrypted1).unwrap(),
            EncryptionService::decrypt(&encrypted2).unwrap()
        );
    }
}
