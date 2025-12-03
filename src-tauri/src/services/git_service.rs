// Git 服务：封装仓库相关操作

use crate::models::{Commit, RepoInfo, RepoStats};
use git2::Repository;
use std::collections::HashSet;
use std::path::PathBuf;

pub struct GitService {
    repo_path: PathBuf,
    repository: Repository,
}

impl GitService {
    /// 打开指定路径的 Git 仓库
    /// 注意：所有时间戳均为 UTC（Unix 秒）
    pub fn open_repo(path: &str) -> Result<Self, String> {
        let repo_path = PathBuf::from(path);

        let repository = Repository::open(&repo_path)
            .map_err(|e| format!("Failed to open Git repository: {}", e))?;

        Ok(Self {
            repo_path,
            repository,
        })
    }

    /// 获取仓库信息
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

        // 统计提交总量
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

    /// 获取指定时间范围内的提交
    /// from：Unix 时间戳（秒）
    /// to：Unix 时间戳（秒）
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

            // 依据时间范围过滤
            if commit_time >= from && commit_time <= to {
                let author = commit.author();

                commits.push(Commit {
                    hash: commit.id().to_string(),
                    author: author.name().unwrap_or("Unknown").to_string(),
                    email: author.email().unwrap_or("").to_string(),
                    timestamp: commit_time,
                    message: commit.message().unwrap_or("").to_string(),
                    diff: None, // 差异内容加载留到 M3
                });
            }

            // 超出时间范围则提前终止
            if commit_time < from {
                break;
            }
        }

        Ok(commits)
    }

    /// 获取指定提交的 diff
    pub fn get_commit_diff(&self, hash: &str) -> Result<String, String> {
        let oid = git2::Oid::from_str(hash)
            .map_err(|e| format!("Invalid commit hash: {}", e))?;

        let commit = self.repository.find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;

        // 获取父提交（若存在）
        let parent = if commit.parent_count() > 0 {
            Some(commit.parent(0)
                .map_err(|e| format!("Failed to get parent: {}", e))?)
        } else {
            None
        };

        // 获取树对象
        let tree = commit.tree()
            .map_err(|e| format!("Failed to get commit tree: {}", e))?;

        let parent_tree = parent.as_ref()
            .map(|p| p.tree())
            .transpose()
            .map_err(|e| format!("Failed to get parent tree: {}", e))?;

        // 生成 diff
        let diff = self.repository.diff_tree_to_tree(
            parent_tree.as_ref(),
            Some(&tree),
            None,
        ).map_err(|e| format!("Failed to create diff: {}", e))?;

        // 将 diff 转为 patch 文本
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

    /// 为超过 10KB 的大提交生成 diff 摘要
    pub fn get_commit_diff_summary(&self, hash: &str) -> Result<String, String> {
        let diff = self.get_commit_diff(hash)?;

        const THRESHOLD: usize = 10 * 1024; // 10KB

        if diff.len() <= THRESHOLD {
            return Ok(diff);
        }

        // 解析 diff 生成概要
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

    /// 基于提交集合统计仓库数据
    pub fn get_stats(&self, commits: &[Commit]) -> Result<RepoStats, String> {
        let mut authors = HashSet::new();
        let mut files_changed = 0;
        let mut insertions = 0;
        let mut deletions = 0;

        // 收集作者集合
        for commit in commits {
            authors.insert(&commit.email);
        }

        // 逐个提交计算 diff 统计
        for commit in commits {
            let oid = git2::Oid::from_str(&commit.hash)
                .map_err(|e| format!("Invalid commit hash: {}", e))?;

            let git_commit = self.repository.find_commit(oid)
                .map_err(|e| format!("Failed to find commit: {}", e))?;

            // 获取父提交（若存在）
            let parent = if git_commit.parent_count() > 0 {
                Some(git_commit.parent(0)
                    .map_err(|e| format!("Failed to get parent: {}", e))?)
            } else {
                None
            };

            // 获取树对象
            let tree = git_commit.tree()
                .map_err(|e| format!("Failed to get commit tree: {}", e))?;

            let parent_tree = parent.as_ref()
                .map(|p| p.tree())
                .transpose()
                .map_err(|e| format!("Failed to get parent tree: {}", e))?;

            // 计算 diff
            let diff = self.repository.diff_tree_to_tree(
                parent_tree.as_ref(),
                Some(&tree),
                None,
            ).map_err(|e| format!("Failed to create diff: {}", e))?;

            // 汇总统计数据
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
