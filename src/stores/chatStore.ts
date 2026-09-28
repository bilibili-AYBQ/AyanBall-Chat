import { create } from "zustand";
import type { Conversation, Message } from "../types";

interface ChatState {
  convs: Conversation[];
  activeConvId: string | null;
  msgs: Record<string, Message[]>;
  setActive: (id: string | null) => void;
  upsertConv: (c: Omit<Conversation, "unread"> & { unread?: number }) => void;
  addMessage: (m: Message) => void;
  markRead: (convId: string) => void;
  removeConv: (convId: string) => void;
  setBlocked: (convId: string, blocked: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  convs: [],
  activeConvId: null,
  msgs: {},

  setActive: (id) => {
    set({ activeConvId: id });
    if (id) {
      const convs = get().convs.map((c) =>
        c.id === id ? { ...c, unread: 0 } : c,
      );
      set({ convs });
    }
  },

  upsertConv: (c: Omit<Conversation, "unread"> & { unread?: number }) => {
    const convs = get().convs;
    const idx = convs.findIndex((x) => x.id === c.id);
    if (idx >= 0) {
      const arr = [...convs];
      arr[idx] = { ...arr[idx], ...c, unread: c.unread ?? arr[idx].unread };
      set({ convs: arr });
    } else {
      const nc: Conversation = {
        id: c.id,
        type: c.type,
        name: c.name,
        avatarText: c.avatarText,
        lastMsg: c.lastMsg,
        lastTs: c.lastTs,
        unread: c.unread ?? 0,
        blocked: c.blocked,
      };
      set({ convs: [nc, ...convs] });
    }
  },

  addMessage: (m) => {
    const msgs = get().msgs;
    const list = msgs[m.convId] ?? [];
    if (list.some((x) => x.id === m.id)) return;
    set({ msgs: { ...msgs, [m.convId]: [...list, m] } });
    // 更新会话摘要与未读数
    const conv = get().convs.find((x) => x.id === m.convId);
    const active = get().activeConvId;
    const isActive = active === m.convId;
    const preview =
      m.kind === "file" ? `[${m.file?.name ?? "file"}]` : m.content;
    const now = Date.now();
    if (conv) {
      const arr = get().convs.map((x) =>
        x.id === m.convId
          ? {
              ...x,
              lastMsg: preview,
              lastTs: now,
              unread: isActive ? 0 : x.unread + 1,
            }
          : x,
      );
      set({ convs: arr });
    } else {
      const nc: Conversation = {
        id: m.convId,
        type: m.roomId.startsWith("g:") ? "group" : "dm",
        name: m.senderName,
        avatarText: m.senderName.slice(0, 1),
        lastMsg: preview,
        lastTs: now,
        unread: isActive ? 0 : 1,
      };
      set({ convs: [nc, ...get().convs] });
    }
  },

  markRead: (convId) => {
    const convs = get().convs.map((c) =>
      c.id === convId ? { ...c, unread: 0 } : c,
    );
    set({ convs });
  },

  removeConv: (convId) => {
    const convs = get().convs.filter((c) => c.id !== convId);
    const msgs = { ...get().msgs };
    delete msgs[convId];
    set({ convs, msgs, activeConvId: get().activeConvId === convId ? null : get().activeConvId });
  },

  setBlocked: (convId, blocked) => {
    const convs = get().convs.map((c) =>
      c.id === convId ? { ...c, blocked } : c,
    );
    set({ convs });
  },
}));
