// Git-related Tauri commands

use crate::models::{Commit, RepoInfo};
use crate::services::GitService;

#[tauri::command]
pub async fn open_repository(path: String) -> Result<RepoInfo, String> {
    let _git_service = GitService::open_repo(&path)?;

    // Return mock data for M1
    let repo_name = std::path::Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    Ok(RepoInfo {
        path: path.clone(),
        name: repo_name,
        branch: "main".to_string(),
        total_commits: 42,
    })
}

#[tauri::command]
pub async fn get_commits(path: String, from: i64, to: i64) -> Result<Vec<Commit>, String> {
    let _git_service = GitService::open_repo(&path)?;

    // Return mock data for M1
    Ok(vec![
        Commit {
            hash: "abc123def456".to_string(),
            author: "Developer".to_string(),
            email: "dev@example.com".to_string(),
            timestamp: from,
            message: "feat: add new feature".to_string(),
            diff: None,
        },
        Commit {
            hash: "def456ghi789".to_string(),
            author: "Developer".to_string(),
            email: "dev@example.com".to_string(),
            timestamp: (from + to) / 2,
            message: "fix: resolve bug".to_string(),
            diff: None,
        },
        Commit {
            hash: "ghi789jkl012".to_string(),
            author: "Developer".to_string(),
            email: "dev@example.com".to_string(),
            timestamp: to,
            message: "docs: update documentation".to_string(),
            diff: None,
        },
    ])
}

#[tauri::command]
pub async fn get_commit_diff(path: String, hash: String) -> Result<String, String> {
    let _git_service = GitService::open_repo(&path)?;

    // Return mock diff for M1
    Ok(format!(
        "diff --git a/file.rs b/file.rs\nindex abc123..def456 100644\n--- a/file.rs\n+++ b/file.rs\n@@ -1,3 +1,4 @@\n fn main() {{\n+    println!(\"Mock diff for {}\");\n }}\n",
        hash
    ))
}
