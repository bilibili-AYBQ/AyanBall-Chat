import AvatarImg from "./Avatar";
import { useFriendStore } from "../stores/friendStore";
import { useT } from "../stores/settingsStore";
import type { CallKind } from "../types";

interface CallsPanelProps {
  onCallRequest: (kind: CallKind, peerId: string, peerName: string) => void;
}

export default function CallsPanel({ onCallRequest }: CallsPanelProps) {
  const t = useT();
  const friends = useFriendStore((s) => s.friends);

  return (
    <div className="h-full flex-1 overflow-y-auto bg-app">
      <div className="mx-auto max-w-[560px] px-8 py-8">
        <h2 className="mb-1 text-lg font-bold text-1">{t("nav.calls")}</h2>
        <p className="mb-6 text-xs text-3">{t("call.safetyTitle")}</p>

        {friends.length === 0 && (
          <div className="py-16 text-center text-xs muted">{t("contact.emptyFriends")}</div>
        )}

        <div className="flex flex-col gap-2">
          {friends
            .filter((f) => !f.blocked)
            .map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-2xl bd bg-panel2 px-4 py-3 sh transition hv"
              >
                {f.avatar ? (
                  <AvatarImg value={f.avatar} size={44} className="rounded-xl!" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/18 text-base font-bold text-blue-300">
                    {(f.nickname || f.username).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-1">{f.nickname || f.username}</div>
                  <div className="text-[11px] text-3">@{f.username}</div>
                </div>
                <div className="flex gap-1.5">
                  <CallBtn
                    title={t("chat.voice")}
                    onClick={() => onCallRequest("voice", f.id, f.nickname || f.username)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5.5 11a6.5 6.5 0 0013 0M8.5 11a3.5 3.5 0 007 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </CallBtn>
                  <CallBtn
                    title={t("chat.video")}
                    onClick={() => onCallRequest("video", f.id, f.nickname || f.username)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M2.5 7.5A2.5 2.5 0 015 5h9a2.5 2.5 0 012.5 2.5v9A2.5 2.5 0 0114 19H5a2.5 2.5 0 01-2.5-2.5v-9zM16.5 10.5l5-3v9l-5-3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    </svg>
                  </CallBtn>
                  <CallBtn
                    title={t("chat.screen")}
                    onClick={() => onCallRequest("screen", f.id, f.nickname || f.username)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="2.5" y="4" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M9 21h6M12 17v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </CallBtn>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function CallBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-soft2 text-2 transition hv2 hover:text-blue-400"
    >
      {children}
    </button>
  );
}
