// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;

fn main() {
    // 检测是否是 serve 子命令 - 如果是则退出
    // serve 命令应该由实际的后端服务二进制文件处理，而不是 GUI 应用
    let args: Vec<String> = std::env::args().collect();
    if args.len() > 1 && args[1] == "serve" {
        // 输出到 stderr（release 模式下不会显示，但可以帮助调试）
        eprintln!("[CodeHubAI] Note: 'serve' command should be handled by backend service binary.");
        std::process::exit(0);
    }

    app::run();
}
