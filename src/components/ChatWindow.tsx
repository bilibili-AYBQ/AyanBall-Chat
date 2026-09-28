import { useEffect, useRef, useState } from "react";
import appIcon from "../assets/app-icon.png";
import Avatar from "./Avatar";
import { useChatStore } from "../stores/chatStore";
import { useAuthStore } from "../stores/authStore";
import { useFriendStore } from "../stores/friendStore";
import { useSettingsStore, useT } from "../stores/settingsStore";
import { useToastStore } from "../stores/toastStore";
import { client } from "../api/client";
import { formatSize, formatTime } from "../lib/format";
import GroupManageModal from "./GroupManageModal";
import type { CallKind, Message } from "../types";

const MAX_FILE = 50 * 1024 * 1024;

// 稳定引用：避免 selector 每次返回新 [] 触发 Zustand/React 无限重渲染
const EMPTY_MSGS: Message[] = [];

interface ChatWindowProps {
  onCallRequest: (kind: CallKind, peerId: string, peerName: string) => void;
}

export default function ChatWindow({ onCallRequest }: ChatWindowProps) {
  const t = useT();
  const conv = useChatStore((s) => s.convs.find((c) => c.id === s.activeConvId));
  const msgs = useChatStore((s) => (conv ? s.msgs[conv.id] ?? EMPTY_MSGS : EMPTY_MSGS));
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const wallpaperCustom = useSettingsStore((s) => s.wallpaperCustom);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const push = useToastStore((s) => s.push);

  // 当前群信息（用于群管理弹窗与成员数展示）
  const group = useFriendStore((s) =>
    conv?.type === "group"
      ? s.groups.find((g) => g.id === conv.id.replace("g:", ""))
      : undefined,
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, conv?.id]);

  if (!conv) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-app">
        <img src={appIcon} alt="" className="mb-4 h-20 w-20 rounded-3xl opacity-40" draggable={false} />
        <p className="text-sm text-3">{t("chat.empty")}</p>
      </div>
    );
  }

  const roomId = conv.type === "dm" ? conv.id.replace("dm:", "") : conv.id.replace("g:", "");
  const peerId = conv.type === "dm" ? conv.id.replace("dm:", "") : "";
  const canCall = conv.type === "dm" && !conv.blocked;

  const sendText = async () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    try {
      await client.sendMessage(roomId, "text", content);
    } catch (e: any) {
      const msg = e?.message ?? "";
      push(t("chat.send"), msg.includes("block") ? t("chat.blockedYou") : t("toast.error"), "error");
    }
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE) {
      // 需求指定的超限提示（一字不差）
      push(t("chat.file"), t("file.tooBig"), "error");
      return;
    }
    void (async () => {
      setUploading(true);
      try {
        const meta = await client.upload(file);
        await client.sendMessage(roomId, "file", meta.name, meta);
      } catch {
        push(t("chat.file"), t("toast.error"), "error");
      } finally {
        setUploading(false);
      }
    })();
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-app">
      {/* 头部：会话信息 + 语音/视频/屏幕共享 + 文件 + 群管理 */}
      <header className="flex items-center justify-between border-b bd bg-panel px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
              conv.type === "group" ? "bg-violet-500/20 text-violet-500" : "bg-blue-500/18 text-blue-500"
            }`}
          >
            {conv.type === "group" ? "群" : conv.avatarText.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold text-1">{conv.name}</h2>
              {conv.type === "group" && (
                <span className="shrink-0 rounded-md bg-violet-500/12 px-1.5 py-0.5 text-[10px] font-bold text-violet-500">
                  {group?.memberCount ?? "?"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-3">
              {conv.type === "group"
                ? `${t("chat.groupMembers")} · ${t("group.memberCount")}`
                : `${t("chat.online")} · @${conv.name}`}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {canCall && (
            <>
              <HeaderBtn title={t("chat.voice")} onClick={() => onCallRequest("voice", peerId, conv.name)}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5.5 11a6.5 6.5 0 0013 0M8.5 11a3.5 3.5 0 007 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </HeaderBtn>
              <HeaderBtn title={t("chat.video")} onClick={() => onCallRequest("video", peerId, conv.name)}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                  <path d="M2.5 7.5A2.5 2.5 0 015 5h9a2.5 2.5 0 012.5 2.5v9A2.5 2.5 0 0114 19H5a2.5 2.5 0 01-2.5-2.5v-9zM16.5 10.5l5-3v9l-5-3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </HeaderBtn>
              <HeaderBtn title={t("chat.screen")} onClick={() => onCallRequest("screen", peerId, conv.name)}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                  <rect x="2.5" y="4" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M9 21h6M12 17v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </HeaderBtn>
            </>
          )}
          <HeaderBtn title={t("chat.fileBtn")} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <span className="spinner h-4! w-4! border-2!" />
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v12M7 8l5-5 5 5M5 21h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </HeaderBtn>
          {conv.type === "group" && (
            <HeaderBtn title={t("group.manage")} onClick={() => setGroupOpen(true)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                <path d="M19.4 13.6l2-1.6-2-3.3-2.6.8a8 8 0 00-.7-1.7l.6-2.7-3.8-1.6-1.7 2.1a8 8 0 00-1.8-.2l-1.8-.2-1.7 3.6 2 2a8 8 0 000 1.8l-2 2 1.7 3.6 1.8-.2a8 8 0 001.8-.2l1.7 2.1 3.8-1.6-.6-2.7a8 8 0 00.7-1.7l2.6.8 2-3.3-2-1.6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </HeaderBtn>
          )}
          <input ref={fileRef} type="file" className="hidden" onChange={pickFile} />
        </div>
      </header>

      {/* 拉黑提示 */}
      {conv.blocked && (
        <div className="border-b bd bg-red-500/10 px-5 py-2 text-xs text-red-400">
          {t("chat.blockedYou")}
        </div>
      )}

      {/* 消息区（应用聊天壁纸） */}
      <div
        ref={scrollRef}
        className={`wp-${wallpaper} flex-1 overflow-y-auto px-5 py-4`}
        style={
          wallpaper === "custom" && wallpaperCustom
            ? { backgroundImage: `url(${wallpaperCustom})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="flex flex-col gap-1.5">
          {msgs.map((m) => (
            <MessageBubble key={m.id} msg={m} group={conv.type === "group"} />
          ))}
          {msgs.length === 0 && (
            <div className="py-16 text-center text-xs muted">AyanBall Chat</div>
          )}
        </div>
      </div>

      {/* 输入区 */}
      <footer className="border-t bd bg-panel px-5 py-3.5">
        <div className="flex items-end gap-3">
          <input
            className="input-dark py-3! flex-1"
            placeholder={conv.blocked ? t("chat.blockedYou") : t("chat.inputPlaceholder")}
            value={text}
            disabled={conv.blocked}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && sendText()}
          />
          <button
            className="btn-accent py-3! px-6"
            disabled={conv.blocked || !text.trim()}
            onClick={sendText}
          >
            {t("chat.send")}
          </button>
        </div>
      </footer>

      {/* 群管理弹窗 */}
      {conv.type === "group" && group && groupOpen && (
        <GroupManageModal group={group} onClose={() => setGroupOpen(false)} />
      )}
    </div>
  );
}

function HeaderBtn({ children, onClick, title, disabled }: { children: React.ReactNode; onClick: () => void; title: string; disabled?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-2 hv2 hover:text-blue-500 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function MessageBubble({ msg, group }: { msg: Message; group: boolean }) {
  const t = useT();
  const myAvatar = useAuthStore((s) => s.user?.avatar);
  if (msg.kind === "system") {
    return (
      <div className="self-center py-1 text-[11px] muted">{msg.content}</div>
    );
  }
  const avatar = msg.mine ? myAvatar : msg.senderAvatar;
  return (
    <div
      className={`flex w-full items-end gap-2.5 ${
        msg.mine ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <Avatar value={avatar} size={36} className="mb-4" />
      <div
        className={`flex max-w-[78%] flex-col ${
          msg.mine ? "items-end" : "items-start"
        }`}
      >
        {group && !msg.mine && (
          <span className="mb-1 ml-1 text-[11px] font-medium text-2">{msg.senderName}</span>
        )}
        <div
          className={`anim-pop px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
            msg.mine
              ? "rounded-2xl rounded-br-md bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-900/20"
              : "rounded-2xl rounded-bl-md border bd bg-bubble/95 text-1 shadow-sm"
          }`}
        >
          {msg.kind === "file" && msg.file ? (
            <button
              type="button"
              onClick={() => {
                client.downloadFile(msg.file!).catch(() =>
                  useToastStore.getState().push("AyanBall Chat", t("file.expireHint"), "error"),
                );
              }}
              className="group flex min-w-[210px] items-center gap-3 text-left no-underline"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${msg.mine ? "bg-white/18" : "bg-blue-500/15 text-blue-500"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2.5H7A1.5 1.5 0 005.5 4v16A1.5 1.5 0 007 21.5h10a1.5 1.5 0 001.5-1.5V8L14 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M14 2.5V8h5.5M12 11.5v5m-2-2l2 2 2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className={`truncate text-[13px] font-semibold ${msg.mine ? "text-white" : "text-1"}`}>
                  {msg.file.name}
                </div>
                <div className={`text-[11px] ${msg.mine ? "text-blue-100" : "text-3"}`}>
                  {formatSize(msg.file.size)} · {t("file.expireHint")}
                </div>
              </div>
            </button>
          ) : (
            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
          )}
        </div>
        <span className="mt-1 px-1 text-[10px] muted">{formatTime(msg.ts)}</span>
      </div>
    </div>
  );
}
