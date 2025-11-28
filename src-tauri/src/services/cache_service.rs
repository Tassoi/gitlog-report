// Cache service - handles LLM response caching
// Note: Repository caching removed due to git2::Repository not being Sync

use std::collections::HashMap;
use std::time::{Duration, SystemTime};
use tokio::sync::RwLock;
use lazy_static::lazy_static;
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};

// LLM response cache with 7-day TTL
#[derive(Clone)]
struct CachedLLMResponse {
    content: String,
    cached_at: SystemTime,
}

impl CachedLLMResponse {
    fn is_expired(&self) -> bool {
        let ttl = Duration::from_secs(7 * 24 * 60 * 60); // 7 days
        SystemTime::now()
            .duration_since(self.cached_at)
            .map(|elapsed| elapsed > ttl)
            .unwrap_or(true)
    }
}

lazy_static! {
    static ref LLM_CACHE: RwLock<HashMap<String, CachedLLMResponse>> = RwLock::new(HashMap::new());
    static ref LLM_CACHE_HITS: RwLock<u64> = RwLock::new(0);
    static ref LLM_CACHE_MISSES: RwLock<u64> = RwLock::new(0);
}

// LLM cache operations
pub fn hash_llm_request(
    provider_type: &str,
    model: &str,
    temperature: f32,
    template_id: &str,
    prompt: &str,
) -> String {
    let input = format!(
        "{}|{}|{}|{}|{}",
        provider_type, model, temperature, template_id, prompt
    );
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub async fn get_cached_llm_response(hash: &str) -> Option<String> {
    let cache = LLM_CACHE.read().await;
    if let Some(cached) = cache.get(hash) {
        if !cached.is_expired() {
            let mut hits = LLM_CACHE_HITS.write().await;
            *hits += 1;
            return Some(cached.content.clone());
        }
    }
    let mut misses = LLM_CACHE_MISSES.write().await;
    *misses += 1;
    None
}

pub async fn cache_llm_response(hash: String, content: String) {
    let mut cache = LLM_CACHE.write().await;
    cache.insert(
        hash,
        CachedLLMResponse {
            content,
            cached_at: SystemTime::now(),
        },
    );
}

pub async fn clear_llm_cache() {
    let mut cache = LLM_CACHE.write().await;
    cache.clear();
    let mut hits = LLM_CACHE_HITS.write().await;
    let mut misses = LLM_CACHE_MISSES.write().await;
    *hits = 0;
    *misses = 0;
}

// Cache statistics
#[derive(Serialize, Deserialize)]
pub struct CacheStats {
    pub llm_count: usize,
    pub llm_memory_mb: f64,
    pub llm_hit_rate: f64,
}

pub async fn get_cache_stats() -> CacheStats {
    let llm_cache = LLM_CACHE.read().await;
    let hits = *LLM_CACHE_HITS.read().await;
    let misses = *LLM_CACHE_MISSES.read().await;

    let llm_count = llm_cache.len();

    // Rough memory estimation
    let llm_memory_mb = llm_cache
        .values()
        .map(|v| v.content.len())
        .sum::<usize>() as f64
        / 1024.0
        / 1024.0;

    let total_requests = hits + misses;
    let llm_hit_rate = if total_requests > 0 {
        (hits as f64 / total_requests as f64) * 100.0
    } else {
        0.0
    };

    CacheStats {
        llm_count,
        llm_memory_mb,
        llm_hit_rate,
    }
}
