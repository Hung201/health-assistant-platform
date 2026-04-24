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
  doctorProfile?: null | {
    professionalTitle: string | null;
    licenseNumber: string | null;
    yearsOfExperience: number | null;
    bio: string | null;
    workplaceName: string | null;
    workplaceAddress: string | null;
    provinceCode: string | null;
    districtCode: string | null;
    wardCode: string | null;
    consultationFee: string;
    isAvailableForBooking: boolean;
    isVerified: boolean;
    verificationStatus: string;
  };
  doctorSpecialty?: null | {
    id: number;
    name: string;
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
    apiPublic<{ ok: boolean; requiresEmailVerification?: boolean; email?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, email: data.email.trim().toLowerCase() }),
    }),
  verifyPatientEmail: (data: { email: string; code: string }) =>
    apiPublic<{ ok: boolean }>('/auth/register/patient/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email: data.email.trim().toLowerCase(), code: data.code.trim() }),
    }),
  resendPatientCode: (email: string) =>
    apiPublic<{ ok: boolean }>('/auth/register/patient/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    }),
  forgotPassword: (email: string) =>
    apiPublic<{ ok: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    apiPublic<{ ok: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: token.trim(), newPassword }),
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
  updateMe: (
    data: Partial<Pick<AuthUser, 'fullName' | 'phone' | 'dateOfBirth' | 'gender' | 'patientProfile'>> & {
      doctorProfile?: {
        professionalTitle?: string | null;
        licenseNumber?: string | null;
        yearsOfExperience?: number | null;
        bio?: string | null;
        workplaceName?: string | null;
        workplaceAddress?: string | null;
        provinceCode?: string | null;
        districtCode?: string | null;
        wardCode?: string | null;
        consultationFee?: string | number | null;
        isAvailableForBooking?: boolean | null;
        specialtyId?: number | null;
      };
    },
  ) =>
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
  workplaceAddress: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
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
  list: (params?: {
    specialtyId?: number;
    provinceCode?: string;
    districtCode?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.specialtyId != null) q.set('specialtyId', String(params.specialtyId));
    if (params?.provinceCode) q.set('provinceCode', params.provinceCode);
    if (params?.districtCode) q.set('districtCode', params.districtCode);
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
  paymentMethod: string;
  paymentStatus: string;
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

export type MyBookingPaymentInfo = {
  bookingId: string;
  bookingCode: string;
  paymentMethod: string;
  paymentStatus: string;
  canPayNow: boolean;
  payUrl: string | null;
  providerOrderId: string | null;
  message: string;
};

export type UserNotificationPriority = 'low' | 'normal' | 'high';

export type UserNotificationRow = {
  id: string;
  type: string;
  priority: UserNotificationPriority;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type UserNotificationsResponse = {
  items: UserNotificationRow[];
  total: number;
  unreadCount: number;
  filter: 'all' | 'unread';
  limit: number;
  offset: number;
};

export const bookingsApi = {
  my: () => api<MyBookingRow[]>('/bookings/me'),
  detail: (id: string) => api<MyBookingDetail>(`/bookings/me/${encodeURIComponent(id)}`),
  paymentInfo: (id: string) => api<MyBookingPaymentInfo>(`/bookings/me/${encodeURIComponent(id)}/payment`),
  create: (data: {
    availableSlotId: number;
    specialtyId?: number;
    patientNote?: string;
    paymentMethod?: 'momo' | 'pay_at_clinic';
  }) =>
    api<{ ok: boolean; id: string; bookingCode: string; status: string; paymentMethod: string; paymentStatus: string }>(
      '/bookings',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  createGuest: (data: {
    availableSlotId: number;
    specialtyId?: number;
    patientNote?: string;
    guestFullName: string;
    guestPhone: string;
    guestEmail: string;
    paymentMethod: 'momo' | 'pay_at_clinic';
  }) =>
    apiPublic<{
      ok: boolean;
      id: string;
      bookingCode: string;
      status: string;
      guestLookupToken: string;
      paymentMethod: string;
      paymentStatus: string;
    }>('/bookings/guest', { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: string, reason?: string) =>
    api<{ ok: boolean; id: string; status: string }>(`/bookings/me/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: reason?.trim() || undefined }),
    }),
};

export const notificationsApi = {
  my: (filter: 'all' | 'unread' = 'all', limit = 20, offset = 0) =>
    api<UserNotificationsResponse>(`/notifications/me?filter=${filter}&limit=${limit}&offset=${offset}`),
  markRead: (id: string) =>
    api<{ ok: boolean; id: string; isRead: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      body: '{}',
    }),
  markAllRead: () =>
    api<{ ok: boolean }>('/notifications/me/read-all', {
      method: 'PATCH',
      body: '{}',
    }),
  streamUrl: () => `${API_BASE}/notifications/stream`,
};

export type DoctorSlotRow = PublicDoctorSlot;
export type DoctorBookingRow = MyBookingRow & {
  patientUserId: string | null;
  patientFullName: string | null;
  patientEmail: string | null;
  patientPhone: string | null;
  guestFullName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
};

export type DoctorPaymentSummary = {
  totalBookings: number;
  pendingApprovalBookings: number;
  payment: {
    periodDays: number;
    paidBookings: number;
    unpaidBookings: number;
    awaitingGatewayBookings: number;
    payAtClinicBookings: number;
    paidRatePct: number;
    paidRevenue: number;
    periodPaidRevenue: number;
    previousPeriodPaidRevenue: number;
    revenueGrowthPct: number;
    todayPaidRevenue: number;
    monthPaidRevenue: number;
  };
  revenueByMethod: Array<{
    paymentMethod: string;
    paidBookings: number;
    revenue: number;
  }>;
  revenueTrend: Array<{
    date: string;
    paidBookings: number;
    revenue: number;
  }>;
};

export const doctorApi = {
  mySlots: () => api<DoctorSlotRow[]>('/doctor/slots'),
  createSlot: (data: { startAt: string; endAt: string; maxBookings: number }) =>
    api<{ ok: boolean; id: number }>('/doctor/slots', { method: 'POST', body: JSON.stringify(data) }),
  cancelSlot: (id: number) =>
    api<{ ok: boolean; id: number; status: string }>(`/doctor/slots/${id}/cancel`, { method: 'PATCH' }),
  myBookings: () => api<DoctorBookingRow[]>('/doctor/bookings'),
  dashboardPaymentSummary: (days = 30) => api<DoctorPaymentSummary>(`/doctor/dashboard/payment-summary?days=${days}`),
  approveBooking: (bookingId: string) =>
    api<{ ok: boolean; id: string; status: string; paymentStatus: string }>(
      `/doctor/bookings/${encodeURIComponent(bookingId)}/approve`,
      { method: 'PATCH', body: '{}' },
    ),
  rejectBooking: (bookingId: string, reason?: string) =>
    api<{ ok: boolean; id: string; status: string }>(
      `/doctor/bookings/${encodeURIComponent(bookingId)}/reject`,
      { method: 'PATCH', body: JSON.stringify({ reason: reason?.trim() || undefined }) },
    ),
};

export type DoctorPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  postType: string;
  viewCount: string;
  createdAt: string;
};

export type DoctorPostDetail = DoctorPostRow & {
  content: string;
  thumbnailUrl: string | null;
  rejectionReason: string | null;
};

export const doctorPostsApi = {
  list: (page = 1, limit = 20) => api<Paginated<DoctorPostRow>>(`/doctor/posts?page=${page}&limit=${limit}`),
  detail: (id: string) => api<DoctorPostDetail>(`/doctor/posts/${id}`),
  create: (data: any) =>
    api<{ ok: boolean; id: string }>('/doctor/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    api<{ ok: boolean; id: string }>(`/doctor/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => api<{ ok: boolean }>(`/doctor/posts/${id}`, { method: 'DELETE' }),
};

export type LiveStreamRow = {
  id: string;
  doctorUserId: string;
  title: string;
  description: string | null;
  status: string;
  roomName: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicLiveStream = {
  id: string;
  title: string;
  doctorName: string;
  startedAt: string | null;
};

export type PublicLiveJoin = PublicLiveStream & {
  serverUrl: string;
  token: string;
};

export const livestreamsApi = {
  listLive: () => apiPublic<PublicLiveStream[]>('/livestreams'),
  join: (id: string) => apiPublic<PublicLiveJoin>(`/livestreams/${id}`),
};

export const doctorLivestreamsApi = {
  create: (data: { title: string; description?: string }) =>
    api<LiveStreamRow>('/doctor/livestreams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  goLive: (id: string) =>
    api<{ stream: LiveStreamRow; serverUrl: string; token: string }>(`/doctor/livestreams/${id}/go-live`, {
      method: 'PATCH',
    }),
  end: (id: string) => api<LiveStreamRow>(`/doctor/livestreams/${id}/end`, { method: 'PATCH' }),
  publisherToken: (id: string) =>
    api<{ serverUrl: string; token: string }>(`/doctor/livestreams/${id}/publisher-token`),
  mine: (page = 1, limit = 20) =>
    api<{ items: LiveStreamRow[]; total: number }>(`/doctor/livestreams/mine/list?page=${page}&limit=${limit}`),
};

export type PublicPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  postType: string;
  viewCount: number;
  publishedAt: string;
  authorName: string;
};

export type PublicPostDetail = PublicPostRow & {
  content: string;
  authorId: string;
};

export type CommentRow = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  likesCount: number;
  isLikedByMe: boolean;
  replies: CommentRow[];
};

export type QaQuestionRow = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  status: 'pending_review' | 'approved' | 'answered' | 'rejected' | string;
  answerContent: string | null;
  answeredAt: string | null;
  createdAt: string;
  patient: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  doctor: null | {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

export const publicPostsApi = {
  list: (page = 1, limit = 20) => apiPublic<Paginated<PublicPostRow>>(`/posts?page=${page}&limit=${limit}`),
  detail: (slug: string) => apiPublic<PublicPostDetail>(`/posts/${slug}`),
  comments: (slug: string) => apiPublic<CommentRow[]>(`/posts/${slug}/comments`),
  addComment: (slug: string, data: { content: string; parentCommentId?: number }) =>
    api<CommentRow>(`/posts/${slug}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reactComment: (commentId: string) =>
    api<{ liked: boolean }>(`/posts/comments/${commentId}/react`, {
      method: 'POST',
    }),
};

export const qaApi = {
  listPublic: (page = 1, limit = 20, category?: string) =>
    apiPublic<Paginated<QaQuestionRow>>(
      `/qa/questions?page=${page}&limit=${limit}${category?.trim() ? `&category=${encodeURIComponent(category.trim())}` : ''}`,
    ),
  detailPublic: (id: string) =>
    apiPublic<QaQuestionRow>(`/qa/questions/${encodeURIComponent(id)}`),
  ask: (data: { title: string; content: string; category?: string }) =>
    api<QaQuestionRow>('/qa/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  doctorInbox: (status: 'all' | 'pending' | 'answered' = 'all', page = 1, limit = 20) =>
    api<Paginated<QaQuestionRow>>(
      `/qa/doctor/inbox?page=${page}&limit=${limit}${status === 'all' ? '' : `&status=${status}`}`,
    ),
  answer: (id: string, data: { content: string }) =>
    api<QaQuestionRow>(`/qa/doctor/questions/${encodeURIComponent(id)}/answer`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export type AdminDashboardSummary = {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  pendingDoctors: number;
  pendingPosts: number;
  totalSpecialties: number;
  pendingBookings: number;
  payment: {
    periodDays: number;
    paidBookings: number;
    unpaidBookings: number;
    awaitingGatewayBookings: number;
    payAtClinicBookings: number;
    paidRatePct: number;
    paidRevenue: number;
    pendingRevenue: number;
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    periodRevenue: number;
    previousPeriodRevenue: number;
    revenueGrowthPct: number;
  };
  revenueByMethod: Array<{
    paymentMethod: string;
    paidBookings: number;
    revenue: number;
  }>;
  topDoctorsByRevenue: Array<{
    doctorUserId: string;
    doctorName: string;
    paidBookings: number;
    revenue: number;
  }>;
  revenueTrend: Array<{
    date: string;
    paidBookings: number;
    revenue: number;
  }>;
};

export type AdminUserFeaturePermissions = {
  livestream: boolean;
};

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  createdAt: string;
  roles: string[];
  featurePermissions: AdminUserFeaturePermissions;
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

export type AdminPendingQuestion = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  status: string;
  createdAt: string;
  patient: {
    id: string;
    fullName: string;
    email: string | null;
  };
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
  dashboardSummary: (days = 30) => api<AdminDashboardSummary>(`/admin/dashboard/summary?days=${days}`),

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
      featurePermissions: AdminUserFeaturePermissions;
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

  updateUser: (
    id: string,
    data: {
      fullName?: string;
      phone?: string | null;
      status?: 'active' | 'disabled';
      featurePermissions?: Partial<AdminUserFeaturePermissions>;
    },
  ) =>
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

  listPendingQuestions: (page = 1, limit = 20) =>
    api<Paginated<AdminPendingQuestion>>(`/admin/questions/pending?page=${page}&limit=${limit}`),

  approveQuestion: (id: string) =>
    api<{ ok: boolean }>(`/admin/questions/${encodeURIComponent(id)}/approve`, {
      method: 'PATCH',
      body: '{}',
    }),

  rejectQuestion: (id: string, reason?: string) =>
    api<{ ok: boolean }>(`/admin/questions/${encodeURIComponent(id)}/reject`, {
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
