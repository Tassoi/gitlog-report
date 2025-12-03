// 缓存服务：LLM 缓存接口（当前实现为无缓存占位）

use serde::{Deserialize, Serialize};

// 缓存统计信息（保留给前端展示用）
#[derive(Serialize, Deserialize)]
pub struct CacheStats {
    pub llm_count: usize,
    pub llm_memory_mb: f64,
    pub llm_hit_rate: f64,
}

pub async fn get_cache_stats() -> CacheStats {
    // 当前没有启用任何 LLM 缓存，固定返回 0
    CacheStats {
        llm_count: 0,
        llm_memory_mb: 0.0,
        llm_hit_rate: 0.0,
    }
}

pub async fn clear_llm_cache() {
    // 无缓存实现，无需清理
}
