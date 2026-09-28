// ================= AyanBall Chat · Tauri 2 Rust 后端 =================
// 当前职责：
//  - 注册通知插件（Windows 10+ 原生气泡 Toast，用于新消息提醒）
//  - 提供若干 Rust 命令（应用信息 / 桌面通知辅助）
use tauri_plugin_notification::NotificationExt;

/// 通过系统原生通知发送一条消息提醒（Windows 气泡弹窗）
#[tauri::command]
fn send_native_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![send_native_notification])
        .run(tauri::generate_context!())
        .expect("error while running AyanBall Chat");
}
