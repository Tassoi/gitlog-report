// Git-related Tauri commands

use crate::models::{Commit, RepoInfo, RepoStats};
use crate::services::{GitService, cache_service};

#[tauri::command]
pub async fn open_repository(path: String) -> Result<RepoInfo, String> {
    let git_service = GitService::open_repo(&path)?;
    git_service.get_repo_info()
}

#[tauri::command]
pub async fn get_commits(path: String, from: i64, to: i64) -> Result<Vec<Commit>, String> {
    let git_service = GitService::open_repo(&path)?;
    git_service.get_commits(from, to)
}

#[tauri::command]
pub async fn get_commit_diff(path: String, hash: String) -> Result<String, String> {
    let git_service = GitService::open_repo(&path)?;
    git_service.get_commit_diff(&hash)
}

#[tauri::command]
pub async fn get_repo_stats(path: String, from: i64, to: i64) -> Result<RepoStats, String> {
    let git_service = GitService::open_repo(&path)?;
    let commits = git_service.get_commits(from, to)?;
    git_service.get_stats(&commits)
}

// Cache management commands (LLM only)
#[tauri::command]
pub async fn get_cache_stats() -> Result<cache_service::CacheStats, String> {
    Ok(cache_service::get_cache_stats().await)
}

#[tauri::command]
pub async fn clear_llm_cache() -> Result<(), String> {
    cache_service::clear_llm_cache().await;
    Ok(())
}
