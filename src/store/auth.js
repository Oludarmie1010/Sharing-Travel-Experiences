import { create } from "zustand";

const KEY = "ts_auth_v1";
const saved = (() => {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
})();

export const useAuth = create((set, get) => ({
  isAuthed: !!saved,
  user: saved || null,
  login: async ({ email, remember = true }) => {
    const user = { email, displayName: (get().user?.displayName || "") };
    if (remember) localStorage.setItem(KEY, JSON.stringify(user));
    set({ isAuthed: true, user });
  },
  signup: async ({ name, email, remember = true }) => {
    const user = { email, displayName: name || "" };
    if (remember) localStorage.setItem(KEY, JSON.stringify(user));
    set({ isAuthed: true, user });
  },
  logout: () => {
    localStorage.removeItem(KEY);
    set({ isAuthed: false, user: null });
  },
  setDisplayName: (name) => {
    const current = get().user || {};
    const user = { ...current, displayName: name };
    localStorage.setItem(KEY, JSON.stringify(user));
    set({ user });
  }
}));
