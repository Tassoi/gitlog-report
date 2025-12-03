// 模块定义
mod commands;
mod models;
mod services;
mod utils;

// 重导出命令以便注册
use commands::{config, export, git, llm, report, template};

// 参考 https://tauri.app/develop/calling-rust/ 了解 Tauri 命令
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            // Git 命令
            git::open_repository,
            git::get_commits,
            git::get_commit_diff,
            git::get_repo_stats,
            // 缓存命令（M6，仅 LLM）
            git::get_cache_stats,
            git::clear_llm_cache,
            // LLM 命令
            llm::configure_llm,
            llm::test_llm_connection,
            // 报告相关命令
            report::generate_weekly_report,
            report::generate_monthly_report,
            // 导出命令（M4）
            export::export_report,
            export::get_save_path,
            // 模板命令（M4.3）
            template::list_templates,
            template::get_template,
            template::create_template,
            template::update_template,
            template::delete_template,
            template::set_default_template,
            template::get_default_template,
            // 配置命令（M5：API Key 自动加密）
            config::save_config,
            config::load_config,
            config::test_proxy,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
