import { create } from "zustand";
import type { ToastItem } from "../types";

let seq = 1;

interface ToastState {
  items: ToastItem[];
  push: (title: string, body: string, kind?: ToastItem["kind"]) => void;
  remove: (id: number) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (title, body, kind = "info") => {
    const id = seq++;
    set({ items: [...get().items, { id, title, body, kind }] });
    setTimeout(() => get().remove(id), 4500);
  },
  remove: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
}));
