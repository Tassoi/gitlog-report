// 防止 Windows Release 版弹出额外控制台窗口，务必保留
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    gitlog_ai_reporter_lib::run()
}
