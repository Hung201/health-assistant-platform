import type { AuthUser } from './api';

export function getStoredUser(): AuthUser | null {
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
