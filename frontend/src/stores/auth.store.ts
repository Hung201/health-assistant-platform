'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthUser } from '@/lib/api';

export type AuthSession = {
  /**
   * Intentionally kept null in normal operation.
   * Access token is stored in HttpOnly cookie for better security.
   */
  accessToken: string | null;
  user: AuthUser | null;
};

type AuthState = AuthSession & {
  /** Set token + user and persist. */
  setSession: (session: { accessToken?: string | null; user: AuthUser }) => void;
  /** Clear token + user and persist. */
  clearSession: () => void;
  /** Clear session + legacy keys. */
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: ({ accessToken, user }) => set({ accessToken: accessToken ?? null, user }),
      clearSession: () => set({ accessToken: null, user: null }),
      logout: () => {
        set({ accessToken: null, user: null });
        syncAuthToLegacyStorage({ accessToken: null, user: null });
      },
    }),
    {
      name: 'auth',
      version: 1,
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    },
  ),
);

/** Bridge for existing code that reads localStorage keys. */
export function syncAuthToLegacyStorage(session: AuthSession) {
  if (typeof window === 'undefined') return;
  // Do not store token in localStorage (avoid exposing it to JS).
  localStorage.removeItem('access_token');

  if (session.user) localStorage.setItem('user', JSON.stringify(session.user));
  else localStorage.removeItem('user');
}

