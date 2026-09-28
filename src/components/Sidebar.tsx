import appIcon from "../assets/app-icon.png";
import { useAuthStore } from "../stores/authStore";
import { useT } from "../stores/settingsStore";

export type NavTab = "chats" | "contacts" | "calls" | "settings";

interface SidebarProps {
  tab: NavTab;
  onTab: (t: NavTab) => void;
  pendingCount: number;
}

/** 清晰易辨认的矢量图标：消息气泡 / 通讯录 / 电话 / 齿轮 */
const NAVS: { key: NavTab; icon: React.ReactNode }[] = [
  {
    key: "chats",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.9 3 2.8 6.5 2.8 10.9c0 2.4 1.2 4.5 3.1 5.9-.2 1.5-.9 2.7-2 3.7.1 0 .2 0 .3.1 1.9.6 3.5.2 4.7-.7 1 .3 2 .4 3.1.4 5.1 0 9.2-3.5 9.2-7.9S17.1 3 12 3z" />
        <circle cx="8" cy="10.5" r="1.3" fill="#fff" />
        <circle cx="12" cy="10.5" r="1.3" fill="#fff" />
        <circle cx="16" cy="10.5" r="1.3" fill="#fff" />
      </svg>
    ),
  },
  {
    key: "contacts",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="8" r="3.4" />
        <path d="M2.6 20c0-3.5 2.9-5.8 6.4-5.8s6.4 2.3 6.4 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="17.2" cy="9" r="2.6" fill="#fff" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16.8 14.4c2.2.4 3.9 2.1 4.5 4.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    key: "calls",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.6 2.8c.8-.2 1.7.1 2.2.8l2 3c.4.6.4 1.4-.1 2L9.2 10c.5 1.9 1.4 3.6 2.9 5 1.4 1.4 3.1 2.3 4.9 2.8l1.3-1.4c.6-.6 1.5-.8 2.2-.4l2.9 1.9c.8.5 1.1 1.5.7 2.3-.6 1.2-1.9 2-3.3 2-1.7 0-3.6-.4-5.5-1.3-2.6-1.2-5-3-6.8-5.3-1.6-2.1-2.6-4.4-2.9-6.6-.2-1.5-.3-3.2.1-4.7.3-1.2 1.1-2.1 2.3-2.4z" />
      </svg>
    ),
  },
  {
    key: "settings",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        <path d="M19.4 13.6l2-1.6-2-3.3-2.6.8a8 8 0 00-.7-1.7l.6-2.7-3.8-1.6-1.7 2.1a8 8 0 00-1.8-.2l-1.8-.2-1.7 3.6 2 2a8 8 0 000 1.8l-2 2 1.7 3.6 1.8-.2a8 8 0 001.8-.2l1.7 2.1 3.8-1.6-.6-2.7a8 8 0 00.7-1.7l2.6.8 2-3.3-2-1.6z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar({ tab, onTab, pendingCount }: SidebarProps) {
  const t = useT();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="flex h-full w-[72px] flex-col items-center border-r bd bg-sidebar py-4">
      {/* 应用 Logo */}
      <div className="relative mb-6">
        <img
          src={appIcon}
          alt="AyanBall"
          className="h-11 w-11 rounded-xl object-cover sh"
          draggable={false}
        />
        {user?.admin && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-black">
            ★
          </span>
        )}
      </div>

      {/* 导航按钮 */}
      <nav className="flex flex-col gap-2">
        {NAVS.map(({ key, icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => onTab(key)}
              title={t(`nav.${key}`)}
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${
                active
                  ? "bg-blue-500/90 text-white shadow-lg shadow-blue-500/30"
                  : "text-2 hv2 hover:text-1"
              }`}
            >
              {icon}
              {key === "contacts" && pendingCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto" />
      <div className="text-[10px] font-medium tracking-widest muted">ABC</div>
    </aside>
  );
}
