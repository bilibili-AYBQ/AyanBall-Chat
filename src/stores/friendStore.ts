import { create } from "zustand";
import type { Friend, FriendRequest, Group } from "../types";

interface FriendState {
  friends: Friend[];
  groups: Group[];
  requests: FriendRequest[];
  blockedIds: string[];
  setFriends: (f: Friend[]) => void;
  setGroups: (g: Group[]) => void;
  setRequests: (r: FriendRequest[]) => void;
  setBlockedIds: (ids: string[]) => void;
  addRequest: (r: FriendRequest) => void;
  addFriend: (f: Friend) => void;
  updateFriend: (f: Friend) => void;
  removeFriend: (id: string) => void;
  toggleBlock: (id: string) => void;
  addGroup: (g: Group) => void;
  updateGroup: (g: Group) => void;
  removeGroup: (id: string) => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  groups: [],
  requests: [],
  blockedIds: [],

  setFriends: (friends) => set({ friends }),
  setGroups: (groups) => set({ groups }),
  setRequests: (requests) => set({ requests }),
  setBlockedIds: (blockedIds) => set({ blockedIds }),

  addRequest: (r) => {
    if (get().requests.some((x) => x.id === r.id)) return;
    set({ requests: [r, ...get().requests] });
  },

  addFriend: (f) => {
    if (get().friends.some((x) => x.id === f.id)) return;
    set({ friends: [f, ...get().friends] });
  },

  updateFriend: (f) => {
    if (!get().friends.some((x) => x.id === f.id)) return;
    set({ friends: get().friends.map((x) => (x.id === f.id ? { ...x, ...f } : x)) });
  },

  removeFriend: (id) => set({ friends: get().friends.filter((x) => x.id !== id) }),

  toggleBlock: (id) => {
    const blocked = get().blockedIds.includes(id);
    set({
      blockedIds: blocked
        ? get().blockedIds.filter((x) => x !== id)
        : [...get().blockedIds, id],
      friends: get().friends.map((f) =>
        f.id === id ? { ...f, blocked: !blocked } : f,
      ),
    });
  },

  addGroup: (g) => {
    if (get().groups.some((x) => x.id === g.id)) return;
    set({ groups: [g, ...get().groups] });
  },

  updateGroup: (g) => {
    const exists = get().groups.some((x) => x.id === g.id);
    if (!exists) {
      set({ groups: [g, ...get().groups] });
      return;
    }
    set({ groups: get().groups.map((x) => (x.id === g.id ? g : x)) });
  },

  removeGroup: (id) => set({ groups: get().groups.filter((x) => x.id !== id) }),
}));
