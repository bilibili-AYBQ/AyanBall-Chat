import { useState } from "react";
import Avatar, { AVATAR_IDS } from "./Avatar";
import { client } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { useSettingsStore, useT } from "../stores/settingsStore";
import { useToastStore } from "../stores/toastStore";
import type { Lang, Wallpaper } from "../types";

const WALLPAPERS: { key: Wallpaper; label: string; css: string }[] = [
  { key: "default", label: "wallpaper.default", css: "linear-gradient(140deg,#e8ecf3,#dde3ee)" },
  { key: "aurora", label: "wallpaper.aurora", css: "linear-gradient(140deg,#101432,#3b2a7a,#0f766e)" },
  { key: "ocean", label: "wallpaper.ocean", css: "linear-gradient(140deg,#0b3a5e,#0f5d7a,#145e5e)" },
  { key: "sunset", label: "wallpaper.sunset", css: "linear-gradient(140deg,#6d1d2e,#a13a20,#5b1e63)" },
  { key: "forest", label: "wallpaper.forest", css: "linear-gradient(140deg,#12351f,#1d5c36,#16494a)" },
];

export default function SettingsPanel() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const settings = useSettingsStore();
  const push = useToastStore((s) => s.push);
  const [apiBase, setApiBase] = useState(settings.server.apiBase);
  const [promoteName, setPromoteName] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const saveAvatar = async () => {
    if (!avatarDraft) return;
    setAvatarBusy(true);
    try {
      const res = await client.setAvatar(avatarDraft);
      useAuthStore.getState().setUser(res.user);
      push(t("settings.avatar"), t("settings.saved"), "success");
      setAvatarOpen(false);
    } catch {
      push(t("settings.avatar"), t("toast.error"), "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  const uploadAvatar = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 200 * 1024) {
      push(t("settings.avatar"), t("settings.avatarTooBig"), "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarDraft(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveServer = () => {
    const v = apiBase.trim() || `${location.origin}/.netlify/functions`;
    settings.setServer({ apiBase: v, url: v, httpUrl: v });
    // 重新连接新服务器
    client.disconnect();
    client.connect();
    push("AyanBall Chat", t("settings.saved"), "success");
  };

  const promote = async () => {
    if (!promoteName.trim()) return;
    try {
      await client.promoteAdmin(promoteName.trim());
      push(t("settings.admin"), t("settings.promoteOk"), "success");
      setPromoteName("");
    } catch {
      push(t("settings.admin"), t("toast.error"), "error");
    }
  };

  const uploadWallpaper = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      push(t("settings.wallpaper"), t("settings.wallpaperTooBig"), "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      settings.setWallpaperCustom(reader.result as string);
      settings.setWallpaper("custom");
      push(t("settings.wallpaper"), t("settings.saved"), "success");
    };
    reader.readAsDataURL(file);
  };

  const langOptions: { key: Lang; label: string }[] = [
    { key: "zh-CN", label: "简体中文" },
    { key: "en", label: "English" },
    { key: "zh-TW", label: "繁體中文" },
  ];

  const themeOptions: { key: "light" | "dark" | "system"; label: string }[] = [
    { key: "light", label: t("settings.light") },
    { key: "dark", label: t("settings.dark") },
    { key: "system", label: t("settings.system") },
  ];

  return (
    <div className="h-full flex-1 overflow-y-auto bg-app">
      <div className="mx-auto max-w-[600px] px-8 py-8">
        <h2 className="mb-6 text-lg font-bold text-1">{t("settings.title")}</h2>

        {/* 个人资料 */}
        <Section title={t("settings.profile")}>
          <div className="flex items-center gap-4">
            <button
              className="group relative shrink-0 transition hover:opacity-90"
              onClick={() => {
                setAvatarDraft(user?.avatar || "p1");
                setAvatarOpen(true);
              }}
              title={t("settings.changeAvatar")}
            >
              <Avatar value={user?.avatar} size={56} />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 opacity-0 transition group-hover:opacity-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M4 20l4-1 10-10-3-3L5 16l-1 4zM14 8l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <div>
              <div className="flex items-center gap-2 text-[15px] font-semibold text-1">
                {user?.nickname || user?.username}
                {user?.admin && (
                  <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-3">@{user?.username}</div>
              <button
                className="mt-1.5 text-xs font-medium text-blue-500 hover:text-blue-600"
                onClick={() => {
                  setAvatarDraft(user?.avatar || "p1");
                  setAvatarOpen(true);
                }}
              >
                {t("settings.changeAvatar")}
              </button>
            </div>
          </div>

          {/* 更换头像面板 */}
          {avatarOpen && (
            <div className="anim-pop mt-4 rounded-xl bd bg-soft p-3.5">
              <div className="mb-2 text-xs font-semibold text-1">{t("settings.avatar")}</div>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => setAvatarDraft(id)}
                    className={`rounded-full transition ${
                      avatarDraft === id
                        ? "ring-2 ring-blue-500 ring-offset-2"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Avatar value={id} size={40} />
                  </button>
                ))}
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-2 transition hover:text-1">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {t("settings.uploadAvatar")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    uploadAvatar(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {avatarDraft && avatarDraft.startsWith("data:") && (
                <div className="mt-3 flex items-center gap-3">
                  <Avatar value={avatarDraft} size={44} />
                  <span className="text-[11px] text-3">{t("settings.avatarPreview")}</span>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-accent flex-1 py-2! text-sm"
                  disabled={avatarBusy}
                  onClick={saveAvatar}
                >
                  {avatarBusy ? t("login.connecting") : t("settings.save")}
                </button>
                <button
                  className="btn-ghost flex-1 py-2! text-sm"
                  onClick={() => setAvatarOpen(false)}
                >
                  {t("settings.cancel")}
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* 外观主题：浅色 / 深色 / 跟随系统 */}
        <Section title={t("settings.theme")}>
          <div className="grid grid-cols-3 gap-2.5">
            {themeOptions.map((th) => (
              <label
                key={th.key}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-3 py-3.5 transition ${
                  settings.theme === th.key
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "bd2 bg-soft hv"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    settings.theme === th.key ? "border-blue-500" : "border-soft2"
                  }`}
                >
                  {settings.theme === th.key && <span className="h-3.5 w-3.5 rounded-full bg-blue-500" />}
                </span>
                <span className="text-xs font-medium text-1">{th.label}</span>
                <input
                  type="radio"
                  className="hidden"
                  checked={settings.theme === th.key}
                  onChange={() => settings.setTheme(th.key)}
                />
              </label>
            ))}
          </div>
        </Section>

        {/* 聊天壁纸（QQ 风格） */}
        <Section title={t("settings.wallpaper")}>
          <p className="mb-3 text-xs text-3">{t("settings.wallpaperHint")}</p>
          <div className="grid grid-cols-3 gap-2.5">
            {WALLPAPERS.map((w) => (
              <button
                key={w.key}
                onClick={() => settings.setWallpaper(w.key)}
                className={`group relative h-20 overflow-hidden rounded-xl border-2 transition ${
                  settings.wallpaper === w.key
                    ? "border-blue-500"
                    : "border-transparent hv"
                }`}
                style={{ background: w.css }}
              >
                {settings.wallpaper === w.key && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <span className="absolute bottom-1.5 left-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {t(w.label)}
                </span>
              </button>
            ))}
            {/* 自定义壁纸 */}
            <label className="relative flex h-20 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed transition bd2 hv">
              {settings.wallpaper === "custom" && settings.wallpaperCustom && (
                <img
                  src={settings.wallpaperCustom}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
              )}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-2">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] font-medium text-2">{t("wallpaper.custom")}</span>
              {settings.wallpaper === "custom" && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  uploadWallpaper(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {settings.wallpaper === "custom" && settings.wallpaperCustom && (
            <button
              className="mt-3 text-xs font-medium text-red-400 hover:text-red-500"
              onClick={() => {
                settings.setWallpaperCustom(null);
                settings.setWallpaper("default");
              }}
            >
              {t("settings.removeWallpaper")}
            </button>
          )}
        </Section>

        {/* 语言 */}
        <Section title={t("settings.lang")}>
          <div className="flex flex-col gap-2">
            {langOptions.map((o) => (
              <label
                key={o.key}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                  settings.lang === o.key
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "bd2 bg-soft hv"
                }`}
              >
                <span className="text-sm text-1">{o.label}</span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    settings.lang === o.key ? "border-blue-500" : "border-soft2"
                  }`}
                >
                  {settings.lang === o.key && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
                </span>
                <input
                  type="radio"
                  className="hidden"
                  checked={settings.lang === o.key}
                  onChange={() => settings.setLang(o.key)}
                />
              </label>
            ))}
          </div>
        </Section>

        {/* 服务器 */}
        <Section title={t("settings.server")}>
          <p className="mb-3 text-xs text-3">{t("settings.serverHint")}</p>
          <div className="flex flex-col gap-2.5">
            <input
              className="input-dark text-xs"
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              placeholder="https://xxx.netlify.app/.netlify/functions"
            />
            <button className="btn-accent py-2! text-sm" onClick={saveServer}>
              {t("settings.save")}
            </button>
          </div>
        </Section>

        {/* 通知与声音 */}
        <Section title={t("settings.notifications")}>
          <Toggle
            label={t("settings.notifyEnabled")}
            checked={settings.notifyEnabled}
            onChange={settings.setNotifyEnabled}
          />
          <Toggle
            label={t("settings.soundEnabled")}
            checked={settings.soundEnabled}
            onChange={settings.setSoundEnabled}
          />
        </Section>

        {/* 管理员面板 */}
        {user?.admin && (
          <Section title={`${t("settings.adminPanel")} · ${t("settings.adminYou")}`}>
            <p className="mb-3 text-xs text-3">{t("settings.promoteNote")}</p>
            <div className="flex gap-2">
              <input
                className="input-dark flex-1 text-xs"
                placeholder={t("settings.promotePh")}
                value={promoteName}
                onChange={(e) => setPromoteName(e.target.value)}
              />
              <button className="btn-accent py-2! text-sm" onClick={promote}>
                {t("settings.promote")}
              </button>
            </div>
          </Section>
        )}

        {/* 退出 */}
        <button
          className="mt-8 w-full rounded-xl bg-red-500/12 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/22"
          onClick={() => {
            logout();
            client.disconnect();
          }}
        >
          {t("settings.logout")}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-3">{title}</h3>
      <div className="rounded-2xl bd bg-panel2 p-4 sh">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className="flex w-full items-center justify-between py-1.5"
      onClick={() => onChange(!checked)}
    >
      <span className="text-sm text-1">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-blue-500" : "bg-soft2"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
