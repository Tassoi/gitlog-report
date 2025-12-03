// 模板管理相关的 Tauri 命令

use crate::models::{ReportTemplate, TemplateType};
use crate::services::TemplateService;
use tauri::AppHandle;

#[tauri::command]
pub async fn list_templates(app: AppHandle) -> Result<Vec<ReportTemplate>, String> {
    TemplateService::list_templates(&app)
}

#[tauri::command]
pub async fn get_template(app: AppHandle, id: String) -> Result<ReportTemplate, String> {
    TemplateService::get_template(&app, &id)
}

#[tauri::command]
pub async fn create_template(
    app: AppHandle,
    name: String,
    template_type: TemplateType,
    content: String,
) -> Result<ReportTemplate, String> {
    TemplateService::create_template(&app, name, template_type, content)
}

#[tauri::command]
pub async fn update_template(
    app: AppHandle,
    id: String,
    name: Option<String>,
    content: Option<String>,
) -> Result<ReportTemplate, String> {
    TemplateService::update_template(&app, id, name, content)
}

#[tauri::command]
pub async fn delete_template(app: AppHandle, id: String) -> Result<(), String> {
    TemplateService::delete_template(&app, &id)
}

#[tauri::command]
pub async fn set_default_template(app: AppHandle, id: String) -> Result<(), String> {
    TemplateService::set_default_template(&app, id)
}

#[tauri::command]
pub async fn get_default_template(
    app: AppHandle,
    template_type: TemplateType,
) -> Result<ReportTemplate, String> {
    TemplateService::get_default_template(&app, template_type)
}
