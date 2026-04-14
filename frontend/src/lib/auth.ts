import type { AuthUser } from './api';
import { useAuthStore } from '@/stores/auth.store';

export function getStoredUser(): AuthUser | null {
  // Prefer Zustand state when available.
  try {
    const s = useAuthStore.getState();
    if (s.user) return s.user;
  } catch {
    // ignore
  }
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.roles?.includes('admin'));
}
