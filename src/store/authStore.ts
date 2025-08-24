import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isTokenValid: () => boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  refreshToken: () => Promise<boolean>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isTokenValid: () => {
    const token = get().token;
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  refreshToken: async () => {
    try {
      // Implement token refresh logic here
      return true;
    } catch {
      return false;
    }
  },
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  initialize: async () => {
    // Implement initialization logic here
  }
}));