/** 判断是否运行在 Tauri WebView 内 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;
}

/**
 * Windows 气泡弹窗通知：
 * - Tauri 环境：使用 tauri-plugin-notification（Windows 原生 Toast）
 * - 浏览器环境：使用 Web Notification API（Netlify 部署后同样可用）
 */
export async function showNotification(title: string, body: string) {
  try {
    if (isTauri()) {
      const mod = await import("@tauri-apps/plugin-notification");
      let granted = await mod.isPermissionGranted();
      if (!granted) {
        granted = (await mod.requestPermission()) === "granted";
      }
      if (granted) {
        mod.sendNotification({ title, body });
      }
      return;
    }
  } catch {
    /* Tauri 插件不可用时降级 */
  }
  try {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      }
    }
  } catch {
    /* ignore */
  }
}
