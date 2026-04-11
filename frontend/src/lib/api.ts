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
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    role?: 'patient' | 'doctor';
    phone?: string;
    licenseNumber?: string;
    specialtyId?: number;
  }) =>
    apiPublic<{ access_token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, email: data.email.trim().toLowerCase() }),
    }),
  specialties: () =>
    apiPublic<{ id: number; name: string; slug: string }[]>('/auth/specialties'),
};

export const usersApi = {
  me: () => api<{ id: string; email: string; fullName: string; roles: string[] }>('/users/me'),
};

export type AdminDashboardSummary = {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  pendingDoctors: number;
  pendingPosts: number;
  totalSpecialties: number;
  pendingBookings: number;
};

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  createdAt: string;
  roles: string[];
};

export type AdminUsersResponse = {
  items: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
};

export type AdminPendingDoctor = {
  userId: string;
  email: string | undefined;
  fullName: string | undefined;
  professionalTitle: string | null;
  licenseNumber: string | null;
  workplaceName: string | null;
  createdAt: string;
};

export type AdminPendingPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  postType: string;
  createdAt: string;
  authorUserId: string;
  authorName: string | null;
  authorEmail: string | null;
};

export type AdminSpecialtyRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  iconUrl: string | null;
  createdAt: string;
};

export const adminApi = {
  dashboardSummary: () => api<AdminDashboardSummary>('/admin/dashboard/summary'),

  listUsers: (page = 1, limit = 20) =>
    api<AdminUsersResponse>(`/admin/users?page=${page}&limit=${limit}`),

  listPendingDoctors: () => api<AdminPendingDoctor[]>('/admin/doctors/pending'),

  approveDoctor: (userId: string) =>
    api<{ ok: boolean }>(`/admin/doctors/${userId}/approve`, {
      method: 'PATCH',
      body: '{}',
    }),

  rejectDoctor: (userId: string) =>
    api<{ ok: boolean }>(`/admin/doctors/${userId}/reject`, {
      method: 'PATCH',
      body: '{}',
    }),

  listPendingPosts: () => api<AdminPendingPost[]>('/admin/posts/pending'),

  approvePost: (id: number) =>
    api<{ ok: boolean }>(`/admin/posts/${id}/approve`, {
      method: 'PATCH',
      body: '{}',
    }),

  rejectPost: (id: number, reason?: string) =>
    api<{ ok: boolean }>(`/admin/posts/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: reason ?? undefined }),
    }),

  listSpecialties: () => api<AdminSpecialtyRow[]>('/admin/specialties'),
};
