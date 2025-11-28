// Git service - handles Git repository operations

use crate::models::{Commit, RepoInfo, RepoStats};
use git2::Repository;
use std::collections::HashSet;
use std::path::PathBuf;

pub struct GitService {
    repo_path: PathBuf,
    repository: Repository,
}

impl GitService {
    /// Opens a Git repository at the specified path
    /// Note: All timestamps are expected to be in UTC (Unix epoch seconds)
    pub fn open_repo(path: &str) -> Result<Self, String> {
        let repo_path = PathBuf::from(path);

        let repository = Repository::open(&repo_path)
            .map_err(|e| format!("Failed to open Git repository: {}", e))?;

        Ok(Self {
            repo_path,
            repository,
        })
    }

    /// Gets repository information
    pub fn get_repo_info(&self) -> Result<RepoInfo, String> {
        let head = self.repository.head()
            .map_err(|e| format!("Failed to get HEAD: {}", e))?;

        let branch_name = head.shorthand()
            .unwrap_or("unknown")
            .to_string();

        let repo_name = self.repo_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Count total commits
        let mut revwalk = self.repository.revwalk()
            .map_err(|e| format!("Failed to create revwalk: {}", e))?;

        revwalk.push_head()
            .map_err(|e| format!("Failed to push HEAD: {}", e))?;

        let total_commits = revwalk.count();

        Ok(RepoInfo {
            path: self.repo_path.to_string_lossy().to_string(),
            name: repo_name,
            branch: branch_name,
            total_commits,
        })
    }

    /// Gets commits within a time range
    /// from: Unix timestamp in seconds
    /// to: Unix timestamp in seconds
    pub fn get_commits(&self, from: i64, to: i64) -> Result<Vec<Commit>, String> {
        let mut revwalk = self.repository.revwalk()
            .map_err(|e| format!("Failed to create revwalk: {}", e))?;

        revwalk.push_head()
            .map_err(|e| format!("Failed to push HEAD: {}", e))?;

        let mut commits = Vec::new();

        for oid_result in revwalk {
            let oid = oid_result.map_err(|e| format!("Failed to get OID: {}", e))?;
            let commit = self.repository.find_commit(oid)
                .map_err(|e| format!("Failed to find commit: {}", e))?;

            let commit_time = commit.time().seconds();

            // Filter by time range
            if commit_time >= from && commit_time <= to {
                let author = commit.author();

                commits.push(Commit {
                    hash: commit.id().to_string(),
                    author: author.name().unwrap_or("Unknown").to_string(),
                    email: author.email().unwrap_or("").to_string(),
                    timestamp: commit_time,
                    message: commit.message().unwrap_or("").to_string(),
                    diff: None, // Diff loading deferred to M3
                });
            }

            // Stop if we're past the time range
            if commit_time < from {
                break;
            }
        }

        Ok(commits)
    }

    /// Gets diff for a specific commit
    pub fn get_commit_diff(&self, hash: &str) -> Result<String, String> {
        let oid = git2::Oid::from_str(hash)
            .map_err(|e| format!("Invalid commit hash: {}", e))?;

        let commit = self.repository.find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;

        // Get parent commit (if exists)
        let parent = if commit.parent_count() > 0 {
            Some(commit.parent(0)
                .map_err(|e| format!("Failed to get parent: {}", e))?)
        } else {
            None
        };

        // Get trees
        let tree = commit.tree()
            .map_err(|e| format!("Failed to get commit tree: {}", e))?;

        let parent_tree = parent.as_ref()
            .map(|p| p.tree())
            .transpose()
            .map_err(|e| format!("Failed to get parent tree: {}", e))?;

        // Create diff
        let diff = self.repository.diff_tree_to_tree(
            parent_tree.as_ref(),
            Some(&tree),
            None,
        ).map_err(|e| format!("Failed to create diff: {}", e))?;

        // Convert diff to patch string
        let mut diff_text = String::new();

        diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
            let origin = line.origin();
            let content = std::str::from_utf8(line.content()).unwrap_or("");

            match origin {
                '+' | '-' | ' ' => {
                    diff_text.push(origin);
                    diff_text.push_str(content);
                }
                'F' => {
                    diff_text.push_str("--- ");
                    diff_text.push_str(content);
                }
                'T' => {
                    diff_text.push_str("+++ ");
                    diff_text.push_str(content);
                }
                'H' => {
                    diff_text.push_str("@@ ");
                    diff_text.push_str(content);
                }
                _ => {
                    diff_text.push_str(content);
                }
            }

            true
        }).map_err(|e| format!("Failed to generate diff patch: {}", e))?;

        Ok(diff_text)
    }

    /// Gets diff summary for large commits (>10KB)
    pub fn get_commit_diff_summary(&self, hash: &str) -> Result<String, String> {
        let diff = self.get_commit_diff(hash)?;

        const THRESHOLD: usize = 10 * 1024; // 10KB

        if diff.len() <= THRESHOLD {
            return Ok(diff);
        }

        // Parse diff to extract summary
        let lines: Vec<&str> = diff.lines().collect();
        let mut files: Vec<String> = Vec::new();
        let mut insertions = 0;
        let mut deletions = 0;

        for line in &lines {
            if line.starts_with("+++") || line.starts_with("---") {
                if let Some(file) = line.split_whitespace().nth(1) {
                    if file != "/dev/null" && !files.contains(&file.to_string()) {
                        files.push(file.to_string());
                    }
                }
            } else if line.starts_with('+') && !line.starts_with("+++") {
                insertions += 1;
            } else if line.starts_with('-') && !line.starts_with("---") {
                deletions += 1;
            }
        }

        let total_files = files.len();
        let files_shown: Vec<String> = files.into_iter().take(20).collect();
        let files_truncated = total_files.saturating_sub(20);

        Ok(format!(
            "⚠️ Large commit (summarized):\n- Modified files: {} total\n- Shown files: {}\n- Hidden files: {}\n- Changes: +{} -{}\n",
            total_files,
            files_shown.join(", "),
            files_truncated,
            insertions,
            deletions
        ))
    }

    /// Gets repository statistics from the given commits
    pub fn get_stats(&self, commits: &[Commit]) -> Result<RepoStats, String> {
        let mut authors = HashSet::new();
        let mut files_changed = 0;
        let mut insertions = 0;
        let mut deletions = 0;

        // Collect unique authors
        for commit in commits {
            authors.insert(&commit.email);
        }

        // Calculate diff stats for each commit
        for commit in commits {
            let oid = git2::Oid::from_str(&commit.hash)
                .map_err(|e| format!("Invalid commit hash: {}", e))?;

            let git_commit = self.repository.find_commit(oid)
                .map_err(|e| format!("Failed to find commit: {}", e))?;

            // Get parent commit (if exists)
            let parent = if git_commit.parent_count() > 0 {
                Some(git_commit.parent(0)
                    .map_err(|e| format!("Failed to get parent: {}", e))?)
            } else {
                None
            };

            // Get trees
            let tree = git_commit.tree()
                .map_err(|e| format!("Failed to get commit tree: {}", e))?;

            let parent_tree = parent.as_ref()
                .map(|p| p.tree())
                .transpose()
                .map_err(|e| format!("Failed to get parent tree: {}", e))?;

            // Calculate diff
            let diff = self.repository.diff_tree_to_tree(
                parent_tree.as_ref(),
                Some(&tree),
                None,
            ).map_err(|e| format!("Failed to create diff: {}", e))?;

            // Count stats
            let stats = diff.stats()
                .map_err(|e| format!("Failed to get diff stats: {}", e))?;

            files_changed += stats.files_changed();
            insertions += stats.insertions();
            deletions += stats.deletions();
        }

        Ok(RepoStats {
            total_commits: commits.len(),
            authors: authors.len(),
            files_changed,
            insertions,
            deletions,
        })
    }
}
