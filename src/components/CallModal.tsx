import { useEffect, useRef, useState } from "react";
import { client } from "../api/client";
import { useCallStore } from "../stores/callStore";
import { useT } from "../stores/settingsStore";
import { webrtc } from "../lib/webrtc";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CallModal() {
  const t = useT();
  const call = useCallStore();
  const [secs, setSecs] = useState(0);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  // 绑定媒体流到 <video>
  useEffect(() => {
    if (localRef.current && call.localStream) localRef.current.srcObject = call.localStream;
    if (remoteRef.current && call.remoteStream) remoteRef.current.srcObject = call.remoteStream;
  }, [call.localStream, call.remoteStream, call.phase]);

  // 通话计时
  useEffect(() => {
    if (call.phase !== "active") {
      setSecs(0);
      return;
    }
    const iv = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [call.phase]);

  // 通话结束短暂展示后自动收起
  useEffect(() => {
    if (call.phase === "ended") {
      const tm = setTimeout(() => useCallStore.getState().end(), 2000);
      return () => clearTimeout(tm);
    }
  }, [call.phase]);

  if (call.phase === "none") return null;

  const kindLabel =
    call.kind === "voice"
      ? t("call.voiceCall")
      : call.kind === "video"
        ? t("call.videoCall")
        : t("call.screenShare");

  const isVideo = call.phase === "active" && (call.kind !== "voice" || call.camOn || call.screenOn);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm anim-fade">
      {/* ============ 来电 ============ */}
      {call.phase === "incoming" && (
        <div className="anim-pop flex w-[360px] flex-col items-center rounded-3xl bd bg-overlay p-8 sh">
          <div className="anim-ring mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M4 7.5C4 4.5 6.5 3 8 3c.5 0 1 .3 1.2.9l1 2.6c.2.5.1 1.1-.3 1.5l-1.5 1.3c.5 2 1.5 3.8 3 5.3 1.5 1.5 3.3 2.5 5.3 3l1.3-1.5c.4-.4 1-.5 1.5-.3l2.6 1c.6.2.9.7.9 1.2 0 1.5-1.5 4-4.5 4C9 20.7 4 15 4 7.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-1">{call.peerName}</h3>
          <p className="mt-1 text-xs text-3">{t("call.incoming")} · {kindLabel}</p>
          <div className="mt-7 flex w-full justify-center gap-8">
            <button
              className="flex h-14 w-14 flex-col items-center justify-center gap-1 text-[10px] text-red-300"
              onClick={() => {
                void client.request("call.hangup", { to: call.peerId, reason: "declined" });
                useCallStore.getState().end();
              }}
            >
              <span className="flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600" style={{ width: 52, height: 52 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7.5C4 4.5 6.5 3 8 3c.5 0 1 .3 1.2.9l1 2.6c.2.5.1 1.1-.3 1.5l-1.5 1.3c.5 2 1.5 3.8 3 5.3 1.5 1.5 3.3 2.5 5.3 3l1.3-1.5c.4-.4 1-.5 1.5-.3l2.6 1c.6.2.9.7.9 1.2 0 1.5-1.5 4-4.5 4C9 20.7 4 15 4 7.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" transform="rotate(135 12 12)" />
                </svg>
              </span>
              {t("call.decline")}
            </button>
            <button
              className="flex h-14 w-14 flex-col items-center justify-center gap-1 text-[10px] text-emerald-300"
              onClick={() => void webrtc.acceptCall()}
            >
              <span className="flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600" style={{ width: 52, height: 52 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7.5C4 4.5 6.5 3 8 3c.5 0 1 .3 1.2.9l1 2.6c.2.5.1 1.1-.3 1.5l-1.5 1.3c.5 2 1.5 3.8 3 5.3 1.5 1.5 3.3 2.5 5.3 3l1.3-1.5c.4-.4 1-.5 1.5-.3l2.6 1c.6.2.9.7.9 1.2 0 1.5-1.5 4-4.5 4C9 20.7 4 15 4 7.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </span>
              {t("call.accept")}
            </button>
          </div>
        </div>
      )}

      {/* ============ 呼叫中 / 连接中 ============ */}
      {(call.phase === "outgoing" || call.phase === "connecting") && (
        <div className="anim-pop flex w-[340px] flex-col items-center rounded-3xl bd bg-overlay p-8 sh">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-soft2 text-2xl font-bold text-1">
            {call.peerName.slice(0, 1).toUpperCase()}
          </div>
          <h3 className="text-lg font-bold text-1">{call.peerName}</h3>
          <p className="mt-1 text-xs text-3">
            {call.phase === "outgoing" ? t("call.calling") : t("call.connecting")} · {kindLabel}
          </p>
          <div className="mt-6">
            <span className="spinner" />
          </div>
          <button
            className="btn-danger mt-6 px-8"
            onClick={() => void webrtc.hangup("ended")}
          >
            {t("call.cancel")}
          </button>
        </div>
      )}

      {/* ============ 通话中 ============ */}
      {call.phase === "active" && (
        <div className="relative flex h-[78vh] w-[88vw] max-w-[980px] flex-col overflow-hidden rounded-3xl bd bg-black shadow-2xl">
          {/* 远端画面 / 语音背景 */}
          {isVideo ? (
            <video ref={remoteRef} autoPlay playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#182238] to-[#0d1320]">
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-blue-500/20 text-4xl font-bold text-blue-200">
                {call.peerName.slice(0, 1).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-slate-100">{call.peerName}</h3>
              <p className="mt-2 font-mono text-lg text-slate-400">
                {pad(Math.floor(secs / 60))}:{pad(secs % 60)}
              </p>
            </div>
          )}

          {/* 本地小窗（视频时显示） */}
          {isVideo && (
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-24 right-4 h-[22%] w-auto rounded-xl border border-white/20 object-cover shadow-xl"
            />
          )}

          {/* 顶部状态 */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
            <span className="text-sm font-semibold text-white/90">{kindLabel}</span>
            <span className="font-mono text-sm text-white/80">
              {pad(Math.floor(secs / 60))}:{pad(secs % 60)}
            </span>
          </div>

          {/* 底部控制栏 */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent px-6 pb-6 pt-10">
            <CtrlBtn
              active={call.micOn}
              label={t("call.mic")}
              onClick={() => {
                const track = call.localStream?.getAudioTracks()[0];
                if (track) track.enabled = call.micOn;
                call.toggleMic();
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="8.5" y="3" width="7" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M5 11a7 7 0 0014 0M12 18v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </CtrlBtn>

            {(call.kind !== "voice" || call.camOn) && (
              <CtrlBtn
                active={call.camOn}
                label={t("call.cam")}
                onClick={() => {
                  const track = call.localStream?.getVideoTracks().find((x) => x.kind === "video" && !x.label.toLowerCase().includes("screen"));
                  if (track) track.enabled = call.camOn;
                  call.toggleCam();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2.5 7.5A2.5 2.5 0 015 5h9a2.5 2.5 0 012.5 2.5v9A2.5 2.5 0 0114 19H5a2.5 2.5 0 01-2.5-2.5v-9zM16.5 10.5l5-3v9l-5-3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </CtrlBtn>
            )}

            {call.kind !== "screen" && (
              <CtrlBtn
                active={call.screenOn}
                label={t("call.screen")}
                onClick={() => {
                  if (!call.screenOn) void webrtc.addScreenTrack();
                  else {
                    const tracks = call.localStream?.getVideoTracks().filter((x) => x.label.toLowerCase().includes("screen"));
                    tracks?.forEach((tr) => tr.stop());
                    call.setScreen(false);
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2.5" y="4" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M9 21h6M12 17v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </CtrlBtn>
            )}

            <button
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 transition hover:bg-red-600"
              title={t("call.hangup")}
              onClick={() => void webrtc.hangup("ended")}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 7.5C4 4.5 6.5 3 8 3c.5 0 1 .3 1.2.9l1 2.6c.2.5.1 1.1-.3 1.5l-1.5 1.3c.5 2 1.5 3.8 3 5.3 1.5 1.5 3.3 2.5 5.3 3l1.3-1.5c.4-.4 1-.5 1.5-.3l2.6 1c.6.2.9.7.9 1.2 0 1.5-1.5 4-4.5 4C9 20.7 4 15 4 7.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" transform="rotate(135 12 12)" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ============ 已结束 ============ */}
      {call.phase === "ended" && (
        <div className="anim-pop flex flex-col items-center rounded-3xl bd bg-overlay px-10 py-8 sh">
          <p className="text-sm text-2">{t("call.ended")}</p>
        </div>
      )}
    </div>
  );
}

function CtrlBtn({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: () => void; active: boolean }) {
  return (
    <button
      className="flex flex-col items-center gap-1 text-[10px] text-slate-300"
      onClick={onClick}
    >
      <span
        className={`flex items-center justify-center rounded-full transition ${
          active ? "bg-white/15 text-white" : "bg-white/8 text-slate-400"
        }`}
        style={{ width: 48, height: 48 }}
      >
        {children}
      </span>
      {label}
    </button>
  );
}
