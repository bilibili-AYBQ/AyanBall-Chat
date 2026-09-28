import { create } from "zustand";
import type { Lang, ServerConfig, Wallpaper } from "../types";
import { t as tGlobal } from "../i18n";
import { getLang } from "../i18n";

export type Theme = "dark" | "light" | "system";

function load<T>(key: string, def: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : def;
  } catch {
    return def;
  }
}

// Netlify Functions 基址：优先环境变量（本地开发/自定义域名），默认当前站点
const DEFAULT_API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) || `${location.origin}/.netlify/functions`;

const DEFAULT_SERVER: ServerConfig = {
  url: `${location.origin}`,
  httpUrl: `${location.origin}`,
  apiBase: DEFAULT_API_BASE,
};

/** 加载服务器配置；旧版（ws/http）自动补 Netlify apiBase */
function loadServer(): ServerConfig {
  const v = load<ServerConfig>("abc-server", DEFAULT_SERVER);
  if (!v || !v.apiBase) {
    const next = { ...DEFAULT_SERVER, ...v };
    localStorage.setItem("abc-server", JSON.stringify(next));
    return next;
  }
  return v;
}

interface SettingsState {
  lang: Lang;
  theme: Theme;
  wallpaper: Wallpaper;
  wallpaperCustom: string | null; // dataURL 或 null
  server: ServerConfig;
  notifyEnabled: boolean;
  soundEnabled: boolean;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  setWallpaper: (w: Wallpaper) => void;
  setWallpaperCustom: (dataUrl: string | null) => void;
  setServer: (s: Partial<ServerConfig>) => void;
  setNotifyEnabled: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
}

const THEMES: Theme[] = ["light", "dark", "system"];

function loadTheme(): Theme {
  const v = load<Theme>("abc-theme", "light");
  return THEMES.includes(v) ? v : "light"; // 旧版脏值/未知值一律回落到白色默认
}

export const useSettingsStore = create<SettingsState>((set) => ({
  lang: getLang(),
  // 默认浅色（白色）主题，可切换深色 / 跟随系统
  theme: loadTheme(),
  wallpaper: load<Wallpaper>("abc-wallpaper", "default"),
  wallpaperCustom: load<string | null>("abc-wallpaper-custom", null),
  server: loadServer(),
  notifyEnabled: load<boolean>("abc-notify", true),
  soundEnabled: load<boolean>("abc-sound", true),
  setLang: (lang) => {
    localStorage.setItem("abc-lang", lang);
    set({ lang });
  },
  setTheme: (theme) => {
    localStorage.setItem("abc-theme", theme);
    set({ theme });
  },
  setWallpaper: (wallpaper) => {
    localStorage.setItem("abc-wallpaper", wallpaper);
    set({ wallpaper });
  },
  setWallpaperCustom: (dataUrl) => {
    if (dataUrl) localStorage.setItem("abc-wallpaper-custom", JSON.stringify(dataUrl));
    else localStorage.removeItem("abc-wallpaper-custom");
    set({ wallpaperCustom: dataUrl });
  },
  setServer: (s) => {
    const next = { ...loadServer(), ...s };
    localStorage.setItem("abc-server", JSON.stringify(next));
    set({ server: next });
  },
  setNotifyEnabled: (v) => {
    localStorage.setItem("abc-notify", JSON.stringify(v));
    set({ notifyEnabled: v });
  },
  setSoundEnabled: (v) => {
    localStorage.setItem("abc-sound", JSON.stringify(v));
    set({ soundEnabled: v });
  },
}));

/** 响应语言的翻译 hook：语言切换时自动重渲染 */
export function useT() {
  const lang = useSettingsStore((s) => s.lang);
  void lang;
  return (key: string, vars?: Record<string, string | number>) =>
    tGlobal(key, vars);
}
