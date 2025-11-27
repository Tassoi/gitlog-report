// Report service - orchestrates report generation with Handlebars templates

use crate::models::{Commit, Report, ReportType};
use crate::services::llm_service::LLMService;
use handlebars::Handlebars;
use serde_json::json;
use std::collections::HashSet;
use std::sync::Arc;
use tauri::AppHandle;

pub struct ReportService {
    llm_service: Arc<LLMService>,
    handlebars: Handlebars<'static>,
}

impl ReportService {
    pub fn new(llm_service: Arc<LLMService>) -> Self {
        let mut handlebars = Handlebars::new();

        // Register templates from embedded strings
        handlebars
            .register_template_string("weekly", include_str!("../templates/weekly.hbs"))
            .expect("Failed to register weekly template");
        handlebars
            .register_template_string("monthly", include_str!("../templates/monthly.hbs"))
            .expect("Failed to register monthly template");

        Self {
            llm_service,
            handlebars,
        }
    }

    /// Generates a weekly report with streaming
    pub async fn generate_weekly(
        &self,
        commits: Vec<Commit>,
        app: AppHandle,
    ) -> Result<Report, String> {
   

        if commits.is_empty() {
            return Err("No commits provided for report generation".to_string());
        }

        let stats = self.calculate_stats(&commits);
        let context = json!({
            "commits": commits.iter().map(|c| json!({
                "hash": &c.hash[..7.min(c.hash.len())], // 短哈希
                "message": &c.message,
                "author": &c.author,
                "timestamp": format_timestamp(c.timestamp),
            })).collect::<Vec<_>>(),
            "total_commits": commits.len(),
            "date_range": format!(
                "{} - {}",
                format_timestamp(commits.iter().map(|c| c.timestamp).min().unwrap_or(0)),
                format_timestamp(commits.iter().map(|c| c.timestamp).max().unwrap_or(0))
            ),
            "unique_authors": stats.unique_authors,
            "files_changed": stats.total_files_changed,
        });


        let prompt = self
            .handlebars
            .render("weekly", &context)
            .map_err(|e| format!("Template rendering error: {}", e))?;


        let content = self
            .llm_service
            .generate_report_streaming(prompt, app)
            .await?;

   

        Ok(Report {
            id: uuid::Uuid::new_v4().to_string(),
            report_type: ReportType::Weekly,
            generated_at: chrono::Utc::now().timestamp(),
            content,
            commits: commits.clone(),
        })
    }

    /// Generates a monthly report with streaming
    pub async fn generate_monthly(
        &self,
        commits: Vec<Commit>,
        app: AppHandle,
    ) -> Result<Report, String> {
        println!("📊 开始生成月报...");
        println!("提交数量: {}", commits.len());

        if commits.is_empty() {
            return Err("No commits provided for report generation".to_string());
        }

        // 限制提交数量，避免 prompt 过长
        const MAX_COMMITS: usize = 100;
        let commits = if commits.len() > MAX_COMMITS {
            println!("⚠️  提交数量过多 ({})，仅使用最近的 {} 个提交", commits.len(), MAX_COMMITS);
            commits.into_iter().take(MAX_COMMITS).collect()
        } else {
            commits
        };

        let stats = self.calculate_stats(&commits);

        // Group commits by week
        let commits_by_week = self.group_commits_by_week(&commits);

        let context = json!({
            "commits": commits.iter().map(|c| json!({
                "hash": &c.hash[..7.min(c.hash.len())],
                "message": &c.message,
                "author": &c.author,
                "timestamp": format_timestamp(c.timestamp),
            })).collect::<Vec<_>>(),
            "total_commits": commits.len(),
            "date_range": format!(
                "{} - {}",
                format_timestamp(commits.iter().map(|c| c.timestamp).min().unwrap_or(0)),
                format_timestamp(commits.iter().map(|c| c.timestamp).max().unwrap_or(0))
            ),
            "unique_authors": stats.unique_authors,
            "files_changed": stats.total_files_changed,
            "weeks_count": commits_by_week.len(),
        });

        let prompt = self
            .handlebars
            .render("monthly", &context)
            .map_err(|e| format!("Template rendering error: {}", e))?;

        let content = self
            .llm_service
            .generate_report_streaming(prompt, app)
            .await?;

        Ok(Report {
            id: uuid::Uuid::new_v4().to_string(),
            report_type: ReportType::Monthly,
            generated_at: chrono::Utc::now().timestamp(),
            content,
            commits: commits.clone(),
        })
    }

    /// Calculates statistics from commits
    fn calculate_stats(&self, commits: &[Commit]) -> ReportStats {
        let unique_authors: HashSet<_> = commits.iter().map(|c| c.author.clone()).collect();

        ReportStats {
            unique_authors: unique_authors.len(),
            total_files_changed: 0, // TODO: 计算文件变更数（需要 diff 信息）
        }
    }

    /// Groups commits by week
    fn group_commits_by_week<'a>(&self, commits: &'a [Commit]) -> Vec<Vec<&'a Commit>> {
        use chrono::{DateTime, Datelike, Utc};

        let mut weeks: std::collections::HashMap<(i32, u32), Vec<&'a Commit>> =
            std::collections::HashMap::new();

        for commit in commits {
            let dt = DateTime::<Utc>::from_timestamp(commit.timestamp, 0)
                .unwrap_or_else(|| Utc::now());
            let year = dt.year();
            let week = dt.iso_week().week();
            weeks.entry((year, week)).or_default().push(commit);
        }

        let mut result: Vec<_> = weeks.into_values().collect();
        result.sort_by_key(|week| {
            week.first()
                .map(|c| c.timestamp)
                .unwrap_or(0)
        });
        result
    }
}

struct ReportStats {
    unique_authors: usize,
    total_files_changed: usize,
}

/// Formats Unix timestamp to human-readable date
fn format_timestamp(timestamp: i64) -> String {
    use chrono::{DateTime, Utc};

    DateTime::<Utc>::from_timestamp(timestamp, 0)
        .map(|dt| dt.format("%Y-%m-%d").to_string())
        .unwrap_or_else(|| "Unknown date".to_string())
}
