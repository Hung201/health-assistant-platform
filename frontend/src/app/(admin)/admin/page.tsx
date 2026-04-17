'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { adminApi } from '@/lib/api';

const quickLinks = [
  { href: '/admin/users', label: 'Danh sách người dùng', desc: 'GET /admin/users', icon: 'group' },
  { href: '/admin/doctors/pending', label: 'Bác sĩ chờ duyệt', desc: 'GET /admin/doctors/pending', icon: 'stethoscope' },
  { href: '/admin/posts/pending', label: 'Bài viết chờ duyệt', desc: 'GET /admin/posts/pending', icon: 'article' },
  { href: '/admin/specialties', label: 'Chuyên khoa (read-only)', desc: 'GET /admin/specialties', icon: 'category' },
  { href: '/admin/settings', label: 'Cài đặt', desc: 'Chưa có API', icon: 'settings' },
];

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: adminApi.dashboardSummary,
  });

  return (
    <>
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bảng điều khiển</h2>
          <p className="text-sm text-muted-foreground">
            Số liệu từ <code className="rounded bg-muted px-1 text-xs">GET /admin/dashboard/summary</code>
          </p>
        </div>
      </header>

      {isError ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { key: 'totalUsers', label: 'Tổng users', sub: 'bảng users' },
          { key: 'totalPatients', label: 'Bệnh nhân', sub: 'patient_profiles' },
          { key: 'totalDoctors', label: 'Bác sĩ (hồ sơ)', sub: 'doctor_profiles' },
          { key: 'pendingDoctors', label: 'BS chờ duyệt', sub: 'verification pending' },
          { key: 'pendingPosts', label: 'Bài chờ duyệt', sub: 'status pending_review' },
          { key: 'pendingBookings', label: 'Lịch chờ', sub: 'bookings pending' },
          { key: 'totalSpecialties', label: 'Chuyên khoa', sub: 'specialties' },
        ].map((card) => (
          <div
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
            key={card.key}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {isLoading ? '…' : data ? String((data as Record<string, number>)[card.key] ?? '—') : '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-bold text-foreground">Chức năng & API</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {quickLinks.map((q) => (
            <Link
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              href={q.href}
              key={q.href}
            >
              <span className="material-symbols-outlined text-primary">{q.icon}</span>
              <div>
                <p className="font-semibold text-foreground">{q.label}</p>
                <p className="text-xs text-muted-foreground">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
