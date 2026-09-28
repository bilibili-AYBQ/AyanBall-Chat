import { useEffect, useRef, useState } from "react";
import TitleBar from "./components/TitleBar";
import Sidebar, { type NavTab } from "./components/Sidebar";
import ConversationList from "./components/ConversationList";
import ChatWindow from "./components/ChatWindow";
import ContactsPanel from "./components/ContactsPanel";
import CallsPanel from "./components/CallsPanel";
import SettingsPanel from "./components/SettingsPanel";
import LoginRegister from "./components/LoginRegister";
import SafetyModal from "./components/SafetyModal";
import CallModal from "./components/CallModal";
import ToastHost from "./components/ToastHost";
import { client, wireServerEvents } from "./api/client";
import { useAuthStore } from "./stores/authStore";
import { useFriendStore } from "./stores/friendStore";
import { useSettingsStore } from "./stores/settingsStore";
import { webrtc } from "./lib/webrtc";
import type { CallKind } from "./types";

export default function App() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const theme = useSettingsStore((s) => s.theme);
  const pendingRequests = useFriendStore((s) => s.requests.length);
  const [tab, setTab] = useState<NavTab>("chats");
  const [pendingCall, setPendingCall] = useState<{
    kind: CallKind;
    peerId: string;
    peerName: string;
  } | null>(null);
  const wired = useRef(false);

  // 应用主题到根元素：light / dark / system（跟随系统使用官方 matchMedia 写法）
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved =
        theme === "system" ? (mq.matches ? "dark" : "light") : theme;
      document.documentElement.setAttribute("data-theme", resolved);
      document.body.setAttribute("data-theme", resolved);
    };
    apply();
    if (theme === "system") {
      // 官方写法：addEventListener("change")；老 WebView 回退 addListener
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", apply);
        return () => mq.removeEventListener("change", apply);
      }
      if (typeof mq.addListener === "function") {
        mq.addListener(apply);
        return () => mq.removeListener(apply);
      }
    }
  }, [theme]);

  // 登录后连接服务器并注册事件路由；未登录时由 LoginRegister 自行管理连接，
  // 这里绝不能 disconnect（否则会掐断登录/注册所需的 WebSocket 连接）
  useEffect(() => {
    if (token && user) {
      if (!wired.current) {
        wireServerEvents();
        wired.current = true;
      }
      client.connect();
    }
  }, [token, user]);

  // 在线状态心跳：Pusher 版无 presence 成员查询，改用 HTTP 心跳（30s 一次）标记在线
  useEffect(() => {
    if (!token || !user) return;
    const beat = () => client.request("ping").catch(() => {});
    beat();
    const timer = setInterval(beat, 30000);
    return () => clearInterval(timer);
  }, [token, user]);

  if (!user || !token) {
    return (
      <div className="flex h-full flex-col">
        <TitleBar />
        <div className="min-h-0 flex-1">
          <LoginRegister />
        </div>
        <ToastHost />
      </div>
    );
  }

  const confirmCall = () => {
    if (!pendingCall) return;
    void webrtc.startCall(pendingCall.kind, pendingCall.peerId, pendingCall.peerName);
    setPendingCall(null);
  };

  const requestCall = (kind: CallKind, peerId: string, peerName: string) => {
    setPendingCall({ kind, peerId, peerName });
  };

  return (
    <div className="flex h-full flex-col">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar tab={tab} onTab={setTab} pendingCount={pendingRequests} />

        <div className="flex min-w-0 flex-1">
          {tab === "chats" && (
            <>
              <ConversationList />
              <ChatWindow onCallRequest={requestCall} />
            </>
          )}
          {tab === "contacts" && <ContactsPanel />}
          {tab === "calls" && <CallsPanel onCallRequest={requestCall} />}
          {tab === "settings" && <SettingsPanel />}
        </div>
      </div>

      <SafetyModal
        open={!!pendingCall}
        kind={pendingCall?.kind ?? "voice"}
        onClose={() => setPendingCall(null)}
        onConfirm={confirmCall}
      />
      <CallModal />
      <ToastHost />
    </div>
  );
}
