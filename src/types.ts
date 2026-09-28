// ================= 全局类型定义 =================

export type Lang = "zh-CN" | "en" | "zh-TW";

export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar?: string; // 预设头像 ID（p1~p12）或自定义 dataURL
  admin: boolean;
  createdAt: number;
}

export interface Friend {
  id: string; // 对方 userId
  username: string;
  nickname: string;
  avatar?: string;
  addedAt: number;
  blocked: boolean;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromUsername: string;
  fromNickname: string;
  fromAvatar?: string;
  toId: string;
  status: "pending" | "accepted" | "rejected";
  ts: number;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  adminIds: string[];
  memberCount: number;
  members: { id: string; username: string; nickname: string; avatar?: string }[];
  createdAt: number;
}

/** 聊天壁纸：内置渐变或自定义图片（dataURL） */
export type Wallpaper = "default" | "aurora" | "ocean" | "sunset" | "forest" | "custom";

export type MessageKind = "text" | "file" | "system";

export interface FileMeta {
  name: string;
  size: number;
  type: string;
  url: string;
  expiresAt: number;
}

export interface Message {
  id: string;
  convId: string; // dm:<peerId> 或 g:<groupId>
  roomId: string; // 服务端房间：dm 时为 peerId，群为 groupId
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  kind: MessageKind;
  content: string;
  file?: FileMeta;
  ts: number;
  mine: boolean;
}

export interface Conversation {
  id: string; // convId
  type: "dm" | "group";
  name: string;
  avatarText: string;
  avatar?: string;
  lastMsg: string;
  lastTs: number;
  unread: number;
  blocked?: boolean;
}

export type CallKind = "voice" | "video" | "screen";
export type CallPhase = "none" | "incoming" | "outgoing" | "connecting" | "active" | "ended";

export interface CallState {
  phase: CallPhase;
  kind: CallKind;
  peerName: string;
  peerId: string;
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
}

export interface ToastItem {
  id: number;
  title: string;
  body: string;
  kind: "info" | "success" | "error" | "message";
}

export interface ServerConfig {
  url: string; // 兼容旧值（已弃用）
  httpUrl: string; // 兼容旧值（已弃用）
  apiBase: string; // Netlify Functions 基址，如 https://xxx.netlify.app/.netlify/functions
}
