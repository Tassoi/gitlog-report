// Report-related Tauri commands

use crate::models::{Commit, Report, ReportType};
use crate::services::{llm_service::LLMService, report_service::ReportService, storage_service::StorageService};
use std::sync::Arc;
use tauri::AppHandle;

#[tauri::command]
pub async fn generate_weekly_report(
    commits: Vec<Commit>,
    app: AppHandle,
) -> Result<Report, String> {
    // Load configuration
    let config = StorageService::load_config(&app)?;

    // Create services
    let llm_service = Arc::new(LLMService::new(config.llm_provider));
    let report_service = ReportService::new(llm_service);

    // Generate report with streaming
    report_service.generate_weekly(commits, app).await
}

#[tauri::command]
pub async fn generate_monthly_report(
    commits: Vec<Commit>,
    app: AppHandle,
) -> Result<Report, String> {
    // Load configuration
    let config = StorageService::load_config(&app)?;

    // Create services
    let llm_service = Arc::new(LLMService::new(config.llm_provider));
    let report_service = ReportService::new(llm_service);

    // Generate report with streaming
    report_service.generate_monthly(commits, app).await
}

// Note: export_report command moved to commands/export.rs for M4 implementation
