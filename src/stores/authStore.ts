import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (u: User) => void;
}

function loadUser(): User | null {
  try {
    const v = localStorage.getItem("abc-user");
    return v ? (JSON.parse(v) as User) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("abc-token"),
  user: loadUser(),
  login: (token, user) => {
    localStorage.setItem("abc-token", token);
    localStorage.setItem("abc-user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("abc-token");
    localStorage.removeItem("abc-user");
    set({ token: null, user: null });
  },
  setUser: (u) => {
    localStorage.setItem("abc-user", JSON.stringify(u));
    set({ user: u });
  },
}));
