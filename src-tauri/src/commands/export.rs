// 导出命令：负责将报告写入文件

use crate::models::Report;
use crate::services::ExportService;
use tauri::AppHandle;

#[tauri::command]
pub async fn export_report(
    report: Report,
    format: String,
    save_path: String,
) -> Result<String, String> {
    println!("📤 Exporting report: format={}, path={}", format, save_path);
    println!("   Report ID: {}, Type: {:?}", report.id, report.report_type);
    println!("   Commits: {}", report.commits.len());

    match format.as_str() {
        "markdown" => {
            ExportService::export_markdown(&report, &save_path)?;
            Ok(format!("成功导出 Markdown 文件到: {}", save_path))
        }
        "html" => {
            ExportService::export_html(&report, &save_path)?;
            Ok(format!("成功导出 HTML 文件到: {}", save_path))
        }
        _ => Err(format!("不支持的导出格式: {}（支持的格式：markdown, html）", format)),
    }
}

/// 打开保存文件对话框并返回所选路径
/// 以独立命令形式暴露，方便前端自行管理对话框 UI
#[tauri::command]
pub async fn get_save_path(
    app: AppHandle,
    default_filename: String,
    format: String,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, FilePath};

    // 确定文件扩展名
    let extension = match format.as_str() {
        "markdown" => "md",
        "html" => "html",
        _ => return Err(format!("Invalid format: {}", format)),
    };

    // 构建文件过滤器
    let filter_name = match format.as_str() {
        "markdown" => "Markdown 文件",
        "html" => "HTML 文件",
        _ => "文件",
    };

    // 弹出保存对话框
    let file_path = app
        .dialog()
        .file()
        .add_filter(filter_name, &[extension])
        .set_file_name(&default_filename)
        .blocking_save_file();

    match file_path {
        Some(FilePath::Path(path)) => Ok(Some(path.to_string_lossy().to_string())),
        Some(FilePath::Url(_)) => Err("URL paths not supported".to_string()),
        None => Ok(None), // 用户取消
    }
}
