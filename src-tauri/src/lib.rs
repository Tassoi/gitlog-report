// Modules
mod commands;
mod models;
mod services;
mod utils;

// Re-export commands for registration
use commands::{config, git, llm, report};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            // Git commands
            git::open_repository,
            git::get_commits,
            git::get_commit_diff,
            // LLM commands
            llm::configure_llm,
            llm::test_llm_connection,
            // Report commands
            report::generate_weekly_report,
            report::generate_monthly_report,
            report::export_report,
            // Config commands
            config::save_config,
            config::load_config,
            config::save_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
