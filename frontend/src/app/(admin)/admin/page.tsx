'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AdminDashboardSummary } from '@/lib/api';
import { adminApi } from '@/lib/api';

const baseSummaryCards: Array<{
  key: keyof Pick<
    AdminDashboardSummary,
    'totalUsers' | 'totalPatients' | 'totalDoctors' | 'pendingDoctors' | 'pendingPosts' | 'pendingBookings' | 'totalSpecialties'
  >;
  label: string;
  sub: string;
}> = [
  { key: 'totalUsers', label: 'Tổng users', sub: 'bảng users' },
  { key: 'totalPatients', label: 'Bệnh nhân', sub: 'patient_profiles' },
  { key: 'totalDoctors', label: 'Bác sĩ (hồ sơ)', sub: 'doctor_profiles' },
  { key: 'pendingDoctors', label: 'BS chờ duyệt', sub: 'verification pending' },
  { key: 'pendingPosts', label: 'Bài chờ duyệt', sub: 'status pending_review' },
  { key: 'pendingBookings', label: 'Lịch chờ', sub: 'bookings pending' },
  { key: 'totalSpecialties', label: 'Chuyên khoa', sub: 'specialties' },
];

const quickLinks = [
  { href: '/admin/users', label: 'Danh sách người dùng', desc: 'GET /admin/users', icon: 'group' },
  { href: '/admin/doctors/pending', label: 'Bác sĩ chờ duyệt', desc: 'GET /admin/doctors/pending', icon: 'stethoscope' },
  { href: '/admin/posts/pending', label: 'Bài viết chờ duyệt', desc: 'GET /admin/posts/pending', icon: 'article' },
  { href: '/admin/questions/pending', label: 'Câu hỏi chờ duyệt', desc: 'GET /admin/questions/pending', icon: 'forum' },
  { href: '/admin/specialties', label: 'Chuyên khoa (read-only)', desc: 'GET /admin/specialties', icon: 'category' },
  { href: '/admin/settings', label: 'Cài đặt', desc: 'Chưa có API', icon: 'settings' },
];

export default function AdminDashboardPage() {
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary', periodDays],
    queryFn: () => adminApi.dashboardSummary(periodDays),
  });
  const fmtCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  const fmtCompactCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
  const formatMethod = (method: string) => {
    if (method === 'momo') return 'MoMo';
    if (method === 'pay_at_clinic') return 'Tại viện';
    return method;
  };
  const payment = data?.payment;
  const trendData = (data?.revenueTrend ?? []).map((d) => ({
    ...d,
    day: new Date(`${d.date}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  }));
  const methodChartData = (data?.revenueByMethod ?? []).map((row) => ({
    ...row,
    label: formatMethod(row.paymentMethod),
  }));
  const topDoctorChartData = (data?.topDoctorsByRevenue ?? []).map((row) => ({
    ...row,
    shortName: row.doctorName.length > 18 ? `${row.doctorName.slice(0, 18)}...` : row.doctorName,
  }));
  const pieColors = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <>
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bảng điều khiển</h2>
          <p className="text-sm text-muted-foreground">
            Số liệu từ <code className="rounded bg-muted px-1 text-xs">GET /admin/dashboard/summary?days=7|30|90</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPeriodDays(d as 7 | 30 | 90)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                periodDays === d
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </header>

      {isError ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {baseSummaryCards.map((card) => (
          <div
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
            key={card.key}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {isLoading ? '…' : data ? String(data[card.key] ?? '—') : '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-bold text-foreground">Thống kê thanh toán</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Doanh thu đã thu',
              value: payment ? fmtCurrency(payment.periodRevenue) : '—',
              sub: `payment_status = paid (${periodDays} ngày)`,
            },
            {
              label: 'Doanh thu chờ xử lý',
              value: payment ? fmtCurrency(payment.pendingRevenue) : '—',
              sub: `awaiting_gateway + unpaid (${periodDays} ngày)`,
            },
            {
              label: 'Tỷ lệ thanh toán thành công',
              value: payment ? `${payment.paidRatePct}%` : '—',
              sub: `paid / tracked payments (${periodDays} ngày)`,
            },
            {
              label: `Tăng trưởng ${periodDays} ngày`,
              value: payment ? `${payment.revenueGrowthPct}%` : '—',
              sub: payment ? `${fmtCurrency(payment.previousPeriodRevenue)} kỳ trước` : '—',
            },
          ].map((card) => (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm" key={card.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{isLoading ? '…' : card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Xu hướng doanh thu theo ngày</h3>
          <p className="mt-1 text-xs text-muted-foreground">Doanh thu thành công trong {periodDays} ngày gần nhất.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtCompactCurrency} />
                <Tooltip formatter={(value) => fmtCurrency(Number(value ?? 0))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Doanh thu theo phương thức</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {methodChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu thanh toán thành công.</p>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={methodChartData}
                        dataKey="revenue"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                      >
                        {methodChartData.map((row, idx) => (
                          <Cell key={row.paymentMethod} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => fmtCurrency(Number(value ?? 0))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {methodChartData.map((row) => (
                    <div
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                      key={row.paymentMethod}
                    >
                      <span className="font-semibold text-foreground">{row.label}</span>
                      <span className="text-muted-foreground">
                        {row.paidBookings} lịch · <b className="text-foreground">{fmtCurrency(row.revenue)}</b>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Top bác sĩ theo doanh thu</h3>
        <div className="mt-4 h-72">
          {topDoctorChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu doanh thu bác sĩ.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDoctorChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="shortName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtCompactCurrency} />
                <Tooltip formatter={(value) => fmtCurrency(Number(value ?? 0))} />
                <Legend />
                <Bar dataKey="revenue" name="Doanh thu" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-1">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Danh sách top bác sĩ theo doanh thu</h3>
          <div className="mt-4 space-y-2">
            {(data?.topDoctorsByRevenue ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu doanh thu bác sĩ.</p>
            ) : (
              data?.topDoctorsByRevenue.map((row) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                  key={row.doctorUserId}
                >
                  <span className="font-semibold text-foreground">{row.doctorName}</span>
                  <span className="text-muted-foreground">
                    {row.paidBookings} lịch · <b className="text-foreground">{fmtCurrency(row.revenue)}</b>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
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
