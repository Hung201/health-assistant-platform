import { useAuthStore } from '@/stores/auth.store';

// Use same-origin proxy via Next rewrites to preserve cookies reliably in dev.
const API_BASE = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const s = useAuthStore.getState();
  // Token is stored in HttpOnly cookie; we intentionally avoid exposing it to JS.
  return s.accessToken;
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
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });
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
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  return res.json();
}

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  patientProfile?: null | {
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    addressLine: string | null;
    provinceCode: string | null;
    districtCode: string | null;
    wardCode: string | null;
    occupation: string | null;
    bloodType: string | null;
  };
  roles: string[];
};

export const authApi = {
  login: (email: string, password: string) =>
    apiPublic<{ ok: boolean }>('/auth/login', {
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
    apiPublic<{ ok: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, email: data.email.trim().toLowerCase() }),
    }),
  specialties: () =>
    apiPublic<{ id: number; name: string; slug: string }[]>('/auth/specialties'),
  logout: () => api<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
};

export const usersApi = {
  me: () =>
    api<AuthUser & { avatarUrl: string | null }>('/users/me'),
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/users/me/avatar`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(await parseApiError(res));
    }
    return res.json() as Promise<{ ok: boolean; avatarUrl: string }>;
  },
  updateMe: (data: Partial<Pick<AuthUser, 'fullName' | 'phone' | 'dateOfBirth' | 'gender' | 'patientProfile'>>) =>
    api<{ ok: boolean; user: AuthUser }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    api<{ ok: boolean }>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export type PublicDoctorCard = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  professionalTitle: string | null;
  workplaceName: string | null;
  consultationFee: string;
  specialties: Array<{ id: number; name: string; isPrimary: boolean }>;
};

export type PublicDoctorDetail = PublicDoctorCard & {
  bio: string | null;
  yearsOfExperience: number | null;
  licenseNumber: string | null;
};

export type PublicDoctorSlot = {
  id: number;
  specialtyId: number | null;
  slotDate: string;
  startAt: string;
  endAt: string;
  maxBookings: number;
  bookedCount: number;
  status: string;
};

export const doctorsApi = {
  list: (params?: { specialtyId?: number; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.specialtyId != null) q.set('specialtyId', String(params.specialtyId));
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const qs = q.toString();
    return apiPublic<Paginated<PublicDoctorCard>>(`/doctors${qs ? `?${qs}` : ''}`);
  },
  detail: (doctorUserId: string) =>
    apiPublic<PublicDoctorDetail>(`/doctors/${encodeURIComponent(doctorUserId)}`),
  slots: (doctorUserId: string, params?: { specialtyId?: number; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.specialtyId != null) q.set('specialtyId', String(params.specialtyId));
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return apiPublic<PublicDoctorSlot[]>(
      `/doctors/${encodeURIComponent(doctorUserId)}/slots${qs ? `?${qs}` : ''}`,
    );
  },
};

export type MyBookingRow = {
  id: string;
  bookingCode: string;
  status: string;
  appointmentDate: string;
  appointmentStartAt: string;
  appointmentEndAt: string;
  doctorUserId: string;
  doctorName: string;
  specialtyId: number;
  specialtyName: string;
  patientNote: string | null;
  consultationFee: string;
  totalFee: string;
  createdAt: string;
};

export type MyBookingDetail = MyBookingRow & {
  doctorNote: string | null;
  rejectionReason: string | null;
  cancelReason: string | null;
  platformFee: string;
  updatedAt: string;
};

export const bookingsApi = {
  my: () => api<MyBookingRow[]>('/bookings/me'),
  detail: (id: string) => api<MyBookingDetail>(`/bookings/me/${encodeURIComponent(id)}`),
  create: (data: { availableSlotId: number; specialtyId?: number; patientNote?: string }) =>
    api<{ ok: boolean; id: string; bookingCode: string; status: string }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancel: (id: string, reason?: string) =>
    api<{ ok: boolean; id: string; status: string }>(`/bookings/me/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: reason?.trim() || undefined }),
    }),
};

export type DoctorSlotRow = PublicDoctorSlot;
export type DoctorBookingRow = MyBookingRow & { patientUserId: string };

export const doctorApi = {
  mySlots: () => api<DoctorSlotRow[]>('/doctor/slots'),
  createSlot: (data: { startAt: string; endAt: string; maxBookings: number; specialtyId?: number }) =>
    api<{ ok: boolean; id: number }>('/doctor/slots', { method: 'POST', body: JSON.stringify(data) }),
  cancelSlot: (id: number) =>
    api<{ ok: boolean; id: number; status: string }>(`/doctor/slots/${id}/cancel`, { method: 'PATCH' }),
  myBookings: () => api<DoctorBookingRow[]>('/doctor/bookings'),
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

export type AdminPostDetail = AdminPendingPost & {
  content: string;
  thumbnailUrl: string | null;
  status: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  rejectionReason: string | null;
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

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export const adminApi = {
  dashboardSummary: () => api<AdminDashboardSummary>('/admin/dashboard/summary'),

  listUsers: (page = 1, limit = 20) =>
    api<AdminUsersResponse>(`/admin/users?page=${page}&limit=${limit}`),

  getUser: (id: string) =>
    api<{
      id: string;
      email: string;
      phone: string | null;
      fullName: string;
      status: string;
      avatarUrl: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      createdAt: string;
      roles: string[];
      patientProfile: null | {
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        addressLine: string | null;
        occupation: string | null;
        bloodType: string | null;
      };
      doctorProfile: null | {
        professionalTitle: string | null;
        licenseNumber: string | null;
        yearsOfExperience: number | null;
        bio: string | null;
        workplaceName: string | null;
        consultationFee: string;
        isVerified: boolean;
        verificationStatus: string;
      };
    }>(`/admin/users/${encodeURIComponent(id)}`),

  createUser: (data: {
    email: string;
    fullName: string;
    password: string;
    phone?: string;
    role: 'patient' | 'doctor' | 'admin';
  }) =>
    api<{ ok: boolean; id: string }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: { fullName?: string; phone?: string | null; status?: 'active' | 'disabled' }) =>
    api<{ ok: boolean; id: string }>(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listPendingDoctors: (page = 1, limit = 20) =>
    api<Paginated<AdminPendingDoctor>>(`/admin/doctors/pending?page=${page}&limit=${limit}`),

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

  listPendingPosts: (page = 1, limit = 20) =>
    api<Paginated<AdminPendingPost>>(`/admin/posts/pending?page=${page}&limit=${limit}`),

  getPost: (id: number) => api<AdminPostDetail>(`/admin/posts/${id}`),

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

  listSpecialties: (page = 1, limit = 50) =>
    api<Paginated<AdminSpecialtyRow>>(`/admin/specialties?page=${page}&limit=${limit}`),

  createSpecialty: (data: { name: string; slug: string; description?: string; iconUrl?: string; status?: 'active' | 'inactive' }) =>
    api<{ ok: boolean; id: string }>('/admin/specialties', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSpecialty: (id: string, data: { name?: string; slug?: string; description?: string; iconUrl?: string; status?: 'active' | 'inactive' }) =>
    api<{ ok: boolean; id: string }>(`/admin/specialties/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  setSpecialtyStatus: (id: string, status: 'active' | 'inactive') =>
    api<{ ok: boolean; id: string; status: string }>(`/admin/specialties/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
