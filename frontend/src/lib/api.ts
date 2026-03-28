const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function parseApiError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  if (!data) return res.statusText || 'Lỗi không xác định';
  const { message } = data;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.length > 0) return String(message[0]);
  return res.statusText || 'Yêu cầu thất bại';
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  return res.json();
}

/** Gọi API không gửi Bearer (đăng nhập, đăng ký). */
export async function apiPublic<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  return res.json();
}

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
};

export const authApi = {
  login: (email: string, password: string) =>
    apiPublic<{ access_token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    }),
  register: (data: { email: string; password: string; fullName: string; role?: string }) =>
    apiPublic<{ access_token: string; user: unknown }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, email: data.email.trim().toLowerCase() }),
    }),
};

export const usersApi = {
  me: () => api<{ id: string; email: string; fullName: string; roles: string[] }>('/users/me'),
};
