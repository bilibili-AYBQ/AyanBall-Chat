import { useMemo, useState } from "react";
import Avatar from "./Avatar";
import { useChatStore } from "../stores/chatStore";
import { useT } from "../stores/settingsStore";
import { formatTime } from "../lib/format";

export default function ConversationList() {
  const t = useT();
  const convs = useChatStore((s) => s.convs);
  const active = useChatStore((s) => s.activeConvId);
  const setActive = useChatStore((s) => s.setActive);
  const [q, setQ] = useState("");

  const sorted = useMemo(() => {
    return [...convs]
      .filter(
        (c) =>
          !q.trim() ||
          c.name.toLowerCase().includes(q.trim().toLowerCase()) ||
          c.lastMsg.toLowerCase().includes(q.trim().toLowerCase()),
      )
      .sort((a, b) => b.lastTs - a.lastTs);
  }, [convs, q]);

  return (
    <div className="flex h-full w-[300px] flex-col border-r bd bg-panel">
      <div className="border-b bd px-4 pb-3 pt-4">
        <h2 className="mb-3 text-sm font-bold text-1">{t("nav.chats")}</h2>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-3"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            className="input-dark pl-9! py-2! text-[13px]!"
            placeholder={t("chat.search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sorted.length === 0 && (
          <div className="px-6 py-10 text-center text-xs text-3">{t("chat.empty")}</div>
        )}
        {sorted.map((c) => {
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive ? "bg-active" : "hv"
              }`}
            >
              {c.type === "group" ? (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM16.5 8.2a3 3 0 100-6M17.5 14.6c2.3.4 4 2.5 4 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </div>
              ) : c.avatar ? (
                <Avatar value={c.avatar} size={44} className="rounded-xl!" />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/18 text-lg font-bold text-blue-300">
                  {c.avatarText.toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13.5px] font-semibold text-1">
                    {c.name}
                  </span>
                  <span className="shrink-0 text-[10.5px] text-3">
                    {c.lastTs ? formatTime(c.lastTs) : ""}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-3">
                    {c.blocked ? "🚫 " : ""}
                    {c.lastMsg || "…"}
                  </span>
                  {c.unread > 0 && (
                    <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {c.unread > 99 ? "99+" : c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
