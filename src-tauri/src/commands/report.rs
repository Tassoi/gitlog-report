// 报告相关 Tauri 命令

use crate::models::{Commit, Report, ReportType};
use crate::services::{llm_service::LLMService, report_service::ReportService, storage_service::StorageService};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoGroup {
    pub repo_id: String,
    pub repo_name: String,
    pub repo_path: String,
    pub commits: Vec<Commit>,
}

#[tauri::command]
pub async fn generate_weekly_report(
    repo_groups: Vec<RepoGroup>,
    template_id: Option<String>,
    app: AppHandle,
) -> Result<Report, String> {
    // 加载配置
    let config = StorageService::load_config(&app)?;

    // 创建服务实例（M5：传递 proxy_config）
    let llm_service = Arc::new(LLMService::new(config.llm_provider, Some(config.proxy_config)));
    let report_service = ReportService::new(llm_service);

    // 以流式方式生成报告
    report_service.generate_weekly(repo_groups, template_id, app).await
}

#[tauri::command]
pub async fn generate_monthly_report(
    repo_groups: Vec<RepoGroup>,
    template_id: Option<String>,
    app: AppHandle,
) -> Result<Report, String> {
    // 加载配置
    let config = StorageService::load_config(&app)?;

    // 创建服务实例（M5：传递 proxy_config）
    let llm_service = Arc::new(LLMService::new(config.llm_provider, Some(config.proxy_config)));
    let report_service = ReportService::new(llm_service);

    // 以流式方式生成报告
    report_service.generate_monthly(repo_groups, template_id, app).await
}

// 说明：export_report 命令已在 M4 中迁移至 commands/export.rs
