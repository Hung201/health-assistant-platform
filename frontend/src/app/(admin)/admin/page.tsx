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
  icon: string;
  color: string;
}> = [
  { key: 'totalUsers', label: 'Tổng người dùng', sub: 'Tài khoản đã đăng ký', icon: 'group', color: 'text-blue-600' },
  { key: 'totalPatients', label: 'Bệnh nhân', sub: 'Hồ sơ bệnh nhân', icon: 'personal_injury', color: 'text-emerald-600' },
  { key: 'totalDoctors', label: 'Bác sĩ (hồ sơ)', sub: 'Hồ sơ hành nghề', icon: 'stethoscope', color: 'text-indigo-600' },
  { key: 'pendingDoctors', label: 'BS chờ duyệt', sub: 'Đang xét duyệt hồ sơ', icon: 'pending_actions', color: 'text-amber-600' },
  { key: 'pendingPosts', label: 'Bài chờ duyệt', sub: 'Bài viết cần kiểm duyệt', icon: 'article', color: 'text-orange-600' },
  { key: 'pendingBookings', label: 'Lịch chờ xác nhận', sub: 'Lịch hẹn chưa xử lý', icon: 'calendar_clock', color: 'text-rose-600' },
  { key: 'totalSpecialties', label: 'Chuyên khoa', sub: 'Chuyên khoa đang hoạt động', icon: 'category', color: 'text-teal-600' },
];

const quickLinks = [
  { href: '/admin/users', label: 'Danh sách người dùng', desc: 'Quản lý tài khoản, cấp quyền', icon: 'group' },
  { href: '/admin/doctors/pending', label: 'Bác sĩ chờ duyệt', desc: 'Xét duyệt hồ sơ hành nghề', icon: 'stethoscope' },
  { href: '/admin/posts/pending', label: 'Bài viết chờ duyệt', desc: 'Kiểm duyệt nội dung y khoa', icon: 'article' },
  { href: '/admin/questions/pending', label: 'Câu hỏi chờ duyệt', desc: 'Duyệt câu hỏi từ bệnh nhân', icon: 'forum' },
  { href: '/admin/specialties', label: 'Quản lý chuyên khoa', desc: 'Thêm, sửa, ẩn chuyên khoa', icon: 'category' },
  { href: '/admin/settings', label: 'Cài đặt hệ thống', desc: 'Cấu hình nền tảng', icon: 'settings' },
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
      {/* Header */}
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bảng điều khiển</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tổng quan hoạt động hệ thống trong{' '}
            <span className="font-semibold text-foreground">{periodDays} ngày</span> gần nhất.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPeriodDays(d)}
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
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {baseSummaryCards.map((card) => (
          <div
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            key={card.key}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.label}</p>
              <span className={`material-symbols-outlined text-[20px] ${card.color}`}>{card.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {isLoading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded-md bg-muted" />
              ) : data ? (
                String(data[card.key] ?? '—')
              ) : (
                '—'
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Payment stats */}
      <div className="mb-8">
        <h3 className="mb-3 text-lg font-bold text-foreground">Thống kê thanh toán</h3>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[
            {
              label: 'Doanh thu đã thu',
              value: payment ? fmtCurrency(payment.periodRevenue) : '—',
              sub: `Đã thanh toán thành công (${periodDays} ngày)`,
              icon: 'payments',
              color: 'text-emerald-600',
            },
            {
              label: 'Doanh thu chờ xử lý',
              value: payment ? fmtCurrency(payment.pendingRevenue) : '—',
              sub: `Đang chờ cổng thanh toán & chưa thu (${periodDays} ngày)`,
              icon: 'hourglass_empty',
              color: 'text-amber-600',
            },
            {
              label: 'Tỷ lệ thanh toán',
              value: payment ? `${payment.paidRatePct}%` : '—',
              sub: `Tỷ lệ lịch hẹn đã thanh toán (${periodDays} ngày)`,
              icon: 'percent',
              color: 'text-blue-600',
            },
            {
              label: `Tăng trưởng ${periodDays} ngày`,
              value: payment ? `${payment.revenueGrowthPct}%` : '—',
              sub: payment ? `So với ${fmtCurrency(payment.previousPeriodRevenue)} kỳ trước` : '—',
              icon: 'trending_up',
              color: 'text-indigo-600',
            },
          ].map((card) => (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md" key={card.label}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <span className={`material-symbols-outlined text-[20px] ${card.color}`}>{card.icon}</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {isLoading ? <span className="inline-block h-8 w-20 animate-pulse rounded-md bg-muted" /> : card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">Xu hướng doanh thu</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Doanh thu trong {periodDays} ngày gần nhất.</p>
          <div className="mt-4 h-56 sm:h-72" style={{ touchAction: 'pan-y', userSelect: 'none' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtCompactCurrency} width={40} />
                <Tooltip formatter={(value) => fmtCurrency(Number(value ?? 0))} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#2563eb"
                  strokeWidth={2}
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
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm"
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

      {/* Top doctors chart */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Top bác sĩ theo doanh thu</h3>
        <div className="mt-4 h-56 sm:h-72" style={{ touchAction: 'pan-y', userSelect: 'none' }}>
          {topDoctorChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu doanh thu bác sĩ.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDoctorChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="shortName" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtCompactCurrency} width={45} />
                <Tooltip formatter={(value) => fmtCurrency(Number(value ?? 0))} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top doctors list */}
      <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Bảng xếp hạng bác sĩ theo doanh thu</h3>
        <div className="mt-4 space-y-2">
          {(data?.topDoctorsByRevenue ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu doanh thu bác sĩ.</p>
          ) : (
            data?.topDoctorsByRevenue.map((row, idx) => (
              <div
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm"
                key={row.doctorUserId}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-400/20 text-amber-700' : idx === 1 ? 'bg-slate-300/30 text-slate-600' : idx === 2 ? 'bg-orange-300/20 text-orange-700' : 'bg-muted text-muted-foreground'}`}>
                  {idx + 1}
                </span>
                <span className="flex-1 font-semibold text-foreground">{row.doctorName}</span>
                <span className="text-muted-foreground">
                  {row.paidBookings} lịch · <b className="text-foreground">{fmtCurrency(row.revenue)}</b>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="mb-6">
        <h3 className="mb-3 text-base font-bold text-foreground">Truy cập nhanh</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((q) => (
            <Link
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
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
