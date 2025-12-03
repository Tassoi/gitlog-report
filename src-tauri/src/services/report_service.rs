// 报告服务：用 Handlebars 模板编排报告生成流程

use crate::commands::report::RepoGroup;
use crate::models::{Commit, Report, ReportType, TemplateType};
use crate::services::{llm_service::LLMService, template_service::TemplateService};
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

        // 从内置字符串注册模板
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

    /// 流式生成周报
    pub async fn generate_weekly(
        &self,
        repo_groups: Vec<RepoGroup>,
        template_id: Option<String>,
        app: AppHandle,
    ) -> Result<Report, String> {
        if repo_groups.is_empty() {
            return Err("No repositories provided for report generation".to_string());
        }

        // 展平所有提交用于统计
        let all_commits: Vec<Commit> = repo_groups
            .iter()
            .flat_map(|g| g.commits.clone())
            .collect();

        if all_commits.is_empty() {
            return Err("No commits provided for report generation".to_string());
        }

        let stats = self.calculate_stats(&all_commits);
        let context = json!({
            "repo_groups": repo_groups.iter().map(|group| json!({
                "repo_name": &group.repo_name,
                "commit_count": group.commits.len(),
                "commits": group.commits.iter().map(|c| json!({
                    "hash": &c.hash[..7.min(c.hash.len())],
                    "message": &c.message,
                    "author": &c.author,
                    "timestamp": format_timestamp(c.timestamp),
                })).collect::<Vec<_>>(),
            })).collect::<Vec<_>>(),
            "total_repos": repo_groups.len(),
            "total_commits": all_commits.len(),
            "date_range": format!(
                "{} - {}",
                format_timestamp(all_commits.iter().map(|c| c.timestamp).min().unwrap_or(0)),
                format_timestamp(all_commits.iter().map(|c| c.timestamp).max().unwrap_or(0))
            ),
            "unique_authors": stats.unique_authors,
            "files_changed": stats.total_files_changed,
        });

        // 读取模板内容
        let template_content = if let Some(tid) = template_id {
            let template = TemplateService::get_template(&app, &tid)?;
            template.content
        } else {
            // 使用默认周报模板
            let default_template = TemplateService::get_default_template(&app, TemplateType::Weekly)?;
            default_template.content
        };

        // 渲染模板
        let prompt = self
            .handlebars
            .render_template(&template_content, &context)
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
            commits: all_commits.clone(),
        })
    }

    /// 流式生成月报
    pub async fn generate_monthly(
        &self,
        repo_groups: Vec<RepoGroup>,
        template_id: Option<String>,
        app: AppHandle,
    ) -> Result<Report, String> {
        if repo_groups.is_empty() {
            return Err("No repositories provided for report generation".to_string());
        }

        // 展平所有提交用于统计
        let all_commits: Vec<Commit> = repo_groups
            .iter()
            .flat_map(|g| g.commits.clone())
            .collect();

        if all_commits.is_empty() {
            return Err("No commits provided for report generation".to_string());
        }

        let stats = self.calculate_stats(&all_commits);
        let commits_by_week = self.group_commits_by_week(&all_commits);

        let context = json!({
            "repo_groups": repo_groups.iter().map(|group| json!({
                "repo_name": &group.repo_name,
                "commit_count": group.commits.len(),
                "commits": group.commits.iter().map(|c| json!({
                    "hash": &c.hash[..7.min(c.hash.len())],
                    "message": &c.message,
                    "author": &c.author,
                    "timestamp": format_timestamp(c.timestamp),
                })).collect::<Vec<_>>(),
            })).collect::<Vec<_>>(),
            "total_repos": repo_groups.len(),
            "total_commits": all_commits.len(),
            "date_range": format!(
                "{} - {}",
                format_timestamp(all_commits.iter().map(|c| c.timestamp).min().unwrap_or(0)),
                format_timestamp(all_commits.iter().map(|c| c.timestamp).max().unwrap_or(0))
            ),
            "unique_authors": stats.unique_authors,
            "files_changed": stats.total_files_changed,
            "weeks_count": commits_by_week.len(),
        });

        // 读取模板内容
        let template_content = if let Some(tid) = template_id {
            let template = TemplateService::get_template(&app, &tid)?;
            template.content
        } else {
            // 使用默认月报模板
            let default_template = TemplateService::get_default_template(&app, TemplateType::Monthly)?;
            default_template.content
        };

        // 渲染模板
        let prompt = self
            .handlebars
            .render_template(&template_content, &context)
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
            commits: all_commits.clone(),
        })
    }

    /// 根据提交计算统计信息
    fn calculate_stats(&self, commits: &[Commit]) -> ReportStats {
        let unique_authors: HashSet<_> = commits.iter().map(|c| c.author.clone()).collect();

        ReportStats {
            unique_authors: unique_authors.len(),
            total_files_changed: 0, // 待办：计算文件变更数（需要 diff 信息）
        }
    }

    /// 按周聚合提交
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

/// 将 Unix 时间戳格式化为可读日期
fn format_timestamp(timestamp: i64) -> String {
    use chrono::{DateTime, Utc};

    DateTime::<Utc>::from_timestamp(timestamp, 0)
        .map(|dt| dt.format("%Y-%m-%d").to_string())
        .unwrap_or_else(|| "Unknown date".to_string())
}
