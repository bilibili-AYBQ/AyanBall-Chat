// ================= AyanBall Chat · Netlify 客户端 =================
// 业务接口：HTTP 请求 Netlify Functions（/.netlify/functions/api）
// 实时通道：Pusher Channels（private-conv_* 消息 / private-user_* 个人事件 / private-call_* 通话信令）
// 文件：50MB 内走 Blobs 预签名直传，3 天有效期
import Pusher from "pusher-js";
import { useAuthStore } from "../stores/authStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useChatStore } from "../stores/chatStore";
import { useFriendStore } from "../stores/friendStore";
import { useCallStore } from "../stores/callStore";
import { useToastStore } from "../stores/toastStore";
import { playNotify } from "../lib/audio";
import { showNotification } from "../lib/notifier";
import { webrtc } from "../lib/webrtc";
import { t } from "../i18n";
import type { CallKind, FileMeta, Friend, Group, Message, FriendRequest, User } from "../types";

type Handler = (payload: any) => void;

class ServerClient {
  private pusher: Pusher | null = null;
  private handlers = new Map<string, Handler>();
  private subscribed = new Set<string>();
  private connecting = false;
  private closedByUser = false;
  private hydrating = false;
  private hydratedOnce = false;

  get connected(): boolean {
    return !!this.pusher && this.pusher.connection.state === "connected";
  }

  /** Netlify Functions 基址（默认当前站点 / .netlify/functions） */
  apiBase(): string {
    return useSettingsStore.getState().server.apiBase;
  }

  // ---------- HTTP 业务请求（替换原 WebSocket request） ----------
  private async api(action: string, payload: any = {}): Promise<any> {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${this.apiBase()}/api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, payload }),
    });
    let data: any = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    if (!res.ok || data.error) throw new Error(data.error || `http-${res.status}`);
    return data;
  }

  request(action: string, payload: any = {}): Promise<any> {
    return this.api(action, payload);
  }

  // ---------- 实时通道 ----------
  connect() {
    if (this.closedByUser) return;
    const token = useAuthStore.getState().token;
    const user = useAuthStore.getState().user;
    if (token && user) {
      this.ensureRealtime(user.id);
      // 只水合一次（disconnect 后复位）：防止 hydrate→setUser→App effect→connect 死循环
      if (!this.hydratedOnce) {
        this.hydratedOnce = true;
        this.request("auth", { token })
          .then((s) => this.hydrate(s))
          .catch(() => {});
      }
    }
  }

  /** 断线重连成功后刷新数据（幂等，不触发 connect 循环） */
  private refresh() {
    const token = useAuthStore.getState().token;
    if (!token || this.hydrating) return;
    this.hydrating = true;
    this.request("auth", { token })
      .then((s) => this.hydrate(s))
      .catch(() => {})
      .finally(() => { this.hydrating = false; });
  }

  disconnect() {
    this.closedByUser = true;
    this.hydratedOnce = false;
    this.hydrating = false;
    try {
      this.pusher?.disconnect();
    } catch {
      /* ignore */
    }
    this.pusher = null;
    this.subscribed.clear();
  }

  private async ensureRealtime(userId: string) {
    if (this.pusher || this.connecting) return;
    this.connecting = true;
    try {
      // 运行时获取 Pusher 公开配置（key/cluster），密钥只在服务端
      const cfg = await this.api("config");
      const key = String(cfg?.pusher?.key || "");
      const cluster = String(cfg?.pusher?.cluster || "mt1");
      if (!key) throw new Error("missing-pusher-key");

      const pusher = new Pusher(key, {
        cluster,
        forceTLS: true,
        authEndpoint: `${this.apiBase()}/pusher`,
        auth: {
          params: { token: useAuthStore.getState().token },
        },
      });
      this.pusher = pusher;
      this.connecting = false;

      pusher.connection.bind("connected", () => {
        this.closedByUser = false;
        useToastStore.getState().push("AyanBall Chat", t("toast.connected"), "success");
        // 重连成功后刷新一次数据，补齐断线期间的消息/群/好友变更
        this.refresh();
      });
      pusher.connection.bind("disconnected", () => {
        useToastStore.getState().push("AyanBall Chat", t("toast.disconnected"), "error");
      });
      pusher.connection.bind("error", (err: any) => {
        console.warn("[AyanBall] pusher error:", err?.error?.message || err?.message || err);
      });

      // 个人事件频道：好友申请/群事件/管理员提升/广播
      pusher.subscribe(`private-user_${userId}`).bind_global((event: string, data: any) => {
        const h = this.handlers.get(String(event ?? ""));
        if (h) h(data);
      });
      // 通话信令频道：call.invite / call.answer / call.ice / call.hangup
      pusher.subscribe(`private-call_${userId}`).bind_global((event: string, data: any) => {
        const h = this.handlers.get(String(event ?? ""));
        if (h) h(data);
      });
      // 我的私聊收件频道（所有 DM 消息都从 private-conv_dm_{me} 到达）
      this.subChannel(`private-conv_dm_${userId}`);
      // 已加入的群频道
      for (const g of useFriendStore.getState().groups) {
        this.ensureGroupChannel(g.id);
      }
    } catch (e: any) {
      this.connecting = false;
      // 静默：无 PUSHER_KEY（本地开发）或网络失败时不自扰，部署配置后自动恢复
      console.warn("[AyanBall] realtime unavailable:", e?.message || e);
    }
  }

  /** 订阅群消息频道（群 id → private-conv_g_{id}） */
  ensureGroupChannel(groupId: string) {
    if (!this.pusher) return;
    this.subChannel(`private-conv_g_${groupId}`);
  }

  /** 退订频道（退群/被踢/群解散） */
  leaveChannel(name: string) {
    if (!this.pusher || !this.subscribed.has(name)) return;
    this.subscribed.delete(name);
    try {
      this.pusher.unsubscribe(name);
    } catch {
      /* ignore */
    }
  }

  private subChannel(name: string) {
    if (!this.pusher || this.subscribed.has(name)) return;
    this.subscribed.add(name);
    this.pusher.subscribe(name).bind("message.new", (data: any) => {
      const h = this.handlers.get("message.new");
      if (h) h(data as any);
    });
  }

  on(action: string, handler: Handler) {
    this.handlers.set(action, handler);
  }

  // ---------- 业务请求 ----------
  register(username: string, password: string, nickname?: string, avatar?: string) {
    return this.request("auth.register", { username, password, nickname, avatar });
  }
  login(username: string, password: string) {
    return this.request("auth.login", { username, password });
  }
  setAvatar(avatar: string) {
    return this.request("profile.setAvatar", { avatar });
  }
  searchUser(username: string) {
    return this.request("friend.search", { username });
  }
  sendFriendRequest(toId: string) {
    return this.request("friend.request", { toId });
  }
  acceptRequest(requestId: string) {
    return this.request("friend.accept", { requestId });
  }
  rejectRequest(requestId: string) {
    return this.request("friend.reject", { requestId });
  }
  removeFriend(friendId: string) {
    return this.request("friend.remove", { friendId });
  }
  blockUser(userId: string) {
    return this.request("block.add", { userId });
  }
  unblockUser(userId: string) {
    return this.request("block.remove", { userId });
  }
  createGroup(name: string) {
    return this.request("group.create", { name });
  }
  joinGroup(code: string) {
    return this.request("group.join", { code });
  }
  leaveGroup(groupId: string) {
    return this.request("group.leave", { groupId });
  }
  setGroupAdmin(groupId: string, userId: string, admin: boolean) {
    return this.request("group.setAdmin", { groupId, userId, admin });
  }
  kickGroupMember(groupId: string, userId: string) {
    return this.request("group.kick", { groupId, userId });
  }
  inviteToGroup(groupId: string, username: string) {
    return this.request("group.invite", { groupId, username });
  }
  dissolveGroup(groupId: string) {
    return this.request("group.dissolve", { groupId });
  }
  transferGroup(groupId: string, userId: string) {
    return this.request("group.transfer", { groupId, userId });
  }
  sendMessage(roomId: string, kind: "text" | "file", content: string, file?: FileMeta) {
    return this.request("message.send", { roomId, kind, content, file });
  }
  promoteAdmin(username: string, key?: string) {
    return this.request("admin.promote", { username, key });
  }

  /** 上传文件（≤50MB，3 天有效期）：函数签发预签名地址 → 客户端直传 */
  async upload(file: File): Promise<FileMeta> {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${this.apiBase()}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name: file.name, size: file.size, type: file.type }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error ?? "upload-failed");
    const put = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": data.file.type || "application/octet-stream" },
      body: file,
    });
    if (!put.ok) throw new Error("upload-failed");
    return data.file as FileMeta;
  }

  /** 下载文件：函数返回 Blobs 预签名 GET 地址 → 客户端拉取并触发浏览器下载 */
  async downloadFile(file: FileMeta): Promise<void> {
    const rel = file.url.startsWith("/") ? file.url : `/${file.url}`;
    const res = await fetch(`${location.origin}${rel}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error ?? "file-expired");
    const blob = await fetch(data.url).then((r) => r.blob());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = data.name || file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  // ---------- 会话数据水合 ----------
  hydrate(s: any) {
    if (s.user) {
      const cur = useAuthStore.getState().user;
      const changed =
        !cur || cur.id !== s.user.id || cur.avatar !== s.user.avatar ||
        cur.admin !== s.user.admin || cur.nickname !== s.user.nickname ||
        cur.username !== s.user.username;
      if (changed) useAuthStore.getState().setUser(s.user);
    }
    if (s.friends) useFriendStore.getState().setFriends(s.friends);
    if (s.groups) {
      useFriendStore.getState().setGroups(s.groups);
      for (const g of s.groups) this.ensureGroupChannel(g.id);
    }
    if (s.requests) useFriendStore.getState().setRequests(s.requests);
    if (s.blocked) useFriendStore.getState().setBlockedIds(s.blocked);
    if (s.rooms) {
      const chat = useChatStore.getState();
      const msgs: Record<string, Message[]> = {};
      for (const r of s.rooms) {
        if (r.msgs?.length) msgs[r.convId] = r.msgs;
        chat.upsertConv(r.conv);
      }
      const cur = useChatStore.getState().msgs;
      useChatStore.setState({ msgs: { ...cur, ...msgs } });
    }
  }
}

export const client = new ServerClient();

// ================= 服务端推送事件总路由（Pusher 事件 → 原有 handlers） =================
export function wireServerEvents() {
  const chat = useChatStore.getState();
  const friends = useFriendStore.getState();
  const auth = useAuthStore.getState();
  const me = auth.user!;

  const convNameFor = (peerId: string, senderName: string): string => {
    const f = useFriendStore.getState().friends.find((x) => x.id === peerId);
    return f?.nickname || senderName || peerId;
  };

  // ---- 新消息（私聊/群聊统一从 conv 频道到达；mine 由发送者判定） ----
  client.on("message.new", (m: Message) => {
    const chatS = useChatStore.getState();
    const convId = m.convId;
    m.mine = m.senderId === me.id; // 群消息统一按发送者视角计算
    const isActive = chatS.activeConvId === convId;
    const isHidden = typeof document !== "undefined" && document.hidden;

    const peerId = convId.startsWith("g:") ? "" : convId.replace("dm:", "");
    const friend = peerId
      ? useFriendStore.getState().friends.find((x) => x.id === peerId)
      : undefined;

    chatS.upsertConv({
      id: convId,
      type: convId.startsWith("g:") ? "group" : "dm",
      name: convId.startsWith("g:")
        ? convId
        : convNameFor(peerId, m.senderName),
      avatarText: m.senderName.slice(0, 1),
      avatar: friend?.avatar || m.senderAvatar,
      lastMsg: m.kind === "file" ? `[${m.file?.name ?? "file"}]` : m.content,
      lastTs: m.ts,
    });
    chatS.addMessage(m);

    if (!isActive || isHidden) {
      playNotify();
      showNotification(
        t("notify.newMessage"),
        `${t("notify.from", { name: m.senderName })}${m.kind === "file" ? `[${m.file?.name}]` : m.content}`,
      );
    }
  });

  // ---- 好友 ----
  client.on("friend.request", (r: FriendRequest) => {
    useFriendStore.getState().addRequest(r);
    playNotify();
    showNotification(t("contact.requests"), `${r.fromNickname || r.fromUsername} → friend`);
  });

  client.on("friend.accepted", (f: Friend) => {
    useFriendStore.getState().addFriend(f);
    useToastStore.getState().push(t("contact.friendSettings"), t("contact.reqAccepted"), "success");
  });

  client.on("friend.rejected", () => {
    useToastStore.getState().push(t("contact.requests"), t("contact.reqRejected"), "error");
  });

  client.on("friend.removed", (payload: { friendId: string }) => {
    useFriendStore.getState().removeFriend(payload.friendId);
    useChatStore.getState().removeConv(`dm:${payload.friendId}`);
    useToastStore.getState().push(t("contact.friendSettings"), t("toast.error"), "error");
  });

  // ---- 个人资料（头像） ----
  client.on("profile.updated", (p: { user: User }) => {
    const authS = useAuthStore.getState();
    const me2 = authS.user;
    if (me2 && me2.id === p.user.id) {
      authS.setUser({ ...me2, ...p.user });
    } else {
      useFriendStore.getState().updateFriend({
        id: p.user.id,
        username: p.user.username,
        nickname: p.user.nickname,
        avatar: p.user.avatar,
        addedAt: 0,
        blocked: false,
      });
    }
  });

  client.on("blocked", (payload: { userId: string }) => {
    useFriendStore.getState().removeFriend(payload.userId);
    useChatStore.getState().setBlocked(`dm:${payload.userId}`, true);
  });

  // ---- 群 ----
  client.on("group.new", (g: Group) => {
    useFriendStore.getState().addGroup(g);
    client.ensureGroupChannel(g.id);
  });
  client.on("group.updated", (p: { group: Group }) => {
    useFriendStore.getState().updateGroup(p.group);
    useToastStore.getState().push(t("contact.groups"), t("group.updated"), "info");
  });
  client.on("group.kicked", (p: { groupId: string }) => {
    useFriendStore.getState().removeGroup(p.groupId);
    useChatStore.getState().removeConv(`g:${p.groupId}`);
    client.leaveChannel(`private-conv_g_${p.groupId}`);
    useToastStore.getState().push(t("contact.groups"), t("group.kicked"), "error");
  });
  client.on("group.removed", (payload: { groupId: string }) => {
    useFriendStore.getState().removeGroup(payload.groupId);
    useChatStore.getState().removeConv(`g:${payload.groupId}`);
    client.leaveChannel(`private-conv_g_${payload.groupId}`);
  });

  // ---- 通话信令（来自 private-call_{me} 频道） ----
  client.on("call.invite", (p: { from: string; fromName: string; kind: CallKind; sdp: RTCSessionDescriptionInit }) => {
    const call = useCallStore.getState();
    if (call.phase !== "none") {
      // 忙线：自动拒绝
      client.request("call.hangup", { to: p.from, reason: "busy" }).catch(() => {});
      return;
    }
    webrtc.onInvite(p.from, p.kind, p.sdp);
    useCallStore.getState().setIncoming(p.kind, p.from, p.fromName);
    playNotify();
  });

  client.on("call.answer", (p: { from: string; sdp: RTCSessionDescriptionInit }) => {
    void webrtc.onAnswer(p.sdp);
  });

  client.on("call.ice", (p: { from: string; candidate: RTCIceCandidateInit }) => {
    void webrtc.onIce(p.candidate);
  });

  client.on("call.hangup", (p: { from: string; reason: string }) => {
    if (useCallStore.getState().phase !== "none") {
      webrtc.remoteHangup(p.reason);
      if (p.reason === "rejected" || p.reason === "busy") {
        useToastStore.getState().push(
          t("call.voiceCall"),
          p.reason === "busy" ? t("call.busy") : t("call.rejected"),
          "error",
        );
      }
    }
  });

  client.on("call.busy", () => {
    useCallStore.getState().end();
    useToastStore.getState().push(t("call.voiceCall"), t("call.busy"), "error");
  });

  client.on("call.peerOffline", () => {
    useCallStore.getState().end();
    useToastStore.getState().push(t("call.voiceCall"), t("call.peerOffline"), "error");
  });

  // ---- 管理员 ----
  client.on("promoted", (p: { userId: string; by: string }) => {
    const u = useAuthStore.getState().user;
    if (u && u.id === p.userId) {
      useAuthStore.getState().setUser({ ...u, admin: true });
      useToastStore.getState().push(t("settings.admin"), t("settings.promoteOk"), "success");
    }
  });

  void me;
  void friends;
  void chat;
  void auth;
}
