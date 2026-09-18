import { create } from 'zustand';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'trader' | 'analyst' | 'admin';
  authProvider: 'google' | 'email';
  createdAt?: string | Date;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authMode: 'login' | 'register';
  intendedDestination: string | null;
  isSessionInitialized: boolean;

  // Actions
  setAuthMode: (mode: 'login' | 'register') => void;
  setIntendedDestination: (dest: string | null) => void;
  clearError: () => void;
  loginWithGoogle: (payload: {
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
    role?: string;
  }) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => Promise<boolean>;
  logout: () => void;
  initSession: () => void;
}

const STORAGE_KEY_USER = 'commodity_greeks_auth_user';
const STORAGE_KEY_TOKEN = 'commodity_greeks_auth_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  authMode: 'login',
  intendedDestination: null,
  isSessionInitialized: false,

  setAuthMode: (mode) => set({ authMode: mode, error: null }),
  setIntendedDestination: (dest) => set({ intendedDestination: dest }),
  clearError: () => set({ error: null }),

  initSession: () => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser);
        set({
          user,
          token: storedToken,
          isAuthenticated: true,
          isSessionInitialized: true
        });
        return;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
    set({ isSessionInitialized: true });
  },

  loginWithGoogle: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate with Google');
      }

      const { user, token } = data;
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_TOKEN, token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'An error occurred during Google sign in'
      });
      return false;
    }
  },

  loginWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      const { user, token } = data;
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_TOKEN, token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed'
      });
      return false;
    }
  },

  registerWithEmail: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      const { user, token } = data;
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_TOKEN, token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Registration failed'
      });
      return false;
    }
  },

  logout: () => {
    try {
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  }
}));
