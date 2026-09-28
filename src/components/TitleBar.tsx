import { useEffect, useState } from "react";
import appIcon from "../assets/app-icon.png";
import { isTauri } from "../lib/notifier";

/**
 * 自定义标题栏（Tauri 2 官方标准写法）
 * - 无边框窗口 (decorations: false) + data-tauri-drag-region 拖动
 * - 最小化/最大化/关闭 调用官方 @tauri-apps/api/window 的 getCurrentWindow()
 * - 对应权限在 src-tauri/capabilities/default.json 中显式声明
 */
export default function TitleBar() {
  const tauri = isTauri();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!tauri) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    void (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const win = getCurrentWindow();
        if (cancelled) return;
        setMaximized(await win.isMaximized());
        const un = await win.onResized(() => {
          void win.isMaximized().then(setMaximized);
        });
        if (cancelled) un();
        else unlisten = un;
      } catch {
        /* 非 Tauri 环境忽略 */
      }
    })();
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [tauri]);

  const win = () =>
    tauri
      ? import("@tauri-apps/api/window").then((m) => m.getCurrentWindow())
      : null;

  const onMinimize = () => void win()?.then((w) => w?.minimize());
  const onToggleMaximize = () =>
    void win()?.then((w) => {
      if (!w) return;
      void w.toggleMaximize();
      void w.isMaximized().then(setMaximized);
    });
  const onClose = () => void win()?.then((w) => w?.close());

  return (
    <header
      data-tauri-drag-region
      className="flex h-11 shrink-0 items-center justify-between border-b bd bg-sidebar select-none"
    >
      {/* 左侧：Logo + 标题（可拖动区域） */}
      <div data-tauri-drag-region className="flex items-center gap-2 pl-4">
        <img
          src={appIcon}
          alt=""
          className="h-5.5 w-5.5 rounded-md object-cover"
          draggable={false}
          style={{ height: 22, width: 22 }}
        />
        <span
          data-tauri-drag-region
          className="text-[12px] font-semibold tracking-[0.02em] text-1"
        >
          AyanBall Chat
        </span>
      </div>

      {/* 右侧：窗口控制（官方 API，仅 Tauri 环境显示） */}
      {tauri ? (
        <div className="flex h-full">
          <button
            title="Minimize"
            onClick={onMinimize}
            className="flex h-full w-12 items-center justify-center text-2 transition hover:bg-hover2"
          >
            <svg width="11" height="11" viewBox="0 0 11 11">
              <path d="M0 5.5h11" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          </button>

          <button
            title={maximized ? "Restore" : "Maximize"}
            onClick={onToggleMaximize}
            className="flex h-full w-12 items-center justify-center text-2 transition hover:bg-hover2"
          >
            {maximized ? (
              <svg width="11" height="11" viewBox="0 0 11 11">
                <rect x="0.6" y="0.6" width="6.8" height="6.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
                <path d="M3.6 3.6h6.8v6.8h-6.8z" fill="none" stroke="currentColor" strokeWidth="1.1" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 11 11">
                <rect x="0.6" y="0.6" width="9.8" height="9.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
              </svg>
            )}
          </button>

          <button
            title="Close"
            onClick={onClose}
            className="flex h-full w-12 items-center justify-center text-2 transition hover:bg-red-500 hover:text-white"
          >
            <svg width="11" height="11" viewBox="0 0 11 11">
              <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="pr-4 text-[11px] text-3">{/* 浏览器模式无窗口控制 */}</div>
      )}
    </header>
  );
}
