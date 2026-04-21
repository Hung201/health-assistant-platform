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
import { doctorApi } from '@/lib/api';

export default function DoctorDashboardPage() {
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['doctor', 'dashboard', 'payment-summary', periodDays],
    queryFn: () => doctorApi.dashboardPaymentSummary(periodDays),
  });
  const fmtCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  const fmtCompactCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
  const formatMethod = (method: string) => {
    if (method === 'momo') return 'MoMo';
    if (method === 'pay_at_clinic') return 'Tại viện';
    return method;
  };
  const trendData = (data?.revenueTrend ?? []).map((d) => ({
    ...d,
    day: new Date(`${d.date}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  }));
  const methodData = (data?.revenueByMethod ?? []).map((row) => ({
    ...row,
    label: formatMethod(row.paymentMethod),
  }));
  const pieColors = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tổng quan</h2>
          <p className="text-sm text-muted-foreground">Quản lý lịch trống và theo dõi lịch hẹn.</p>
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Doanh thu kỳ {periodDays} ngày</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {isLoading ? '…' : fmtCurrency(data?.payment.periodPaidRevenue ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tăng trưởng theo kỳ</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {isLoading ? '…' : `${data?.payment.revenueGrowthPct ?? 0}%`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLoading ? '…' : `${fmtCurrency(data?.payment.previousPeriodPaidRevenue ?? 0)} kỳ trước`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tỷ lệ thanh toán thành công</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{isLoading ? '…' : `${data?.payment.paidRatePct ?? 0}%`}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lịch chờ duyệt</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{isLoading ? '…' : data?.pendingApprovalBookings ?? 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Xu hướng doanh thu</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtCompactCurrency} />
              <Tooltip formatter={(value) => fmtCurrency(Number(value ?? 0))} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="paidBookings" name="Lịch đã thanh toán" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Thanh toán theo phương thức</h3>
          <div className="mt-4 h-64">
            {methodData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu thanh toán thành công.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodData} dataKey="revenue" nameKey="label" cx="50%" cy="50%" outerRadius={85}>
                    {methodData.map((row, idx) => (
                      <Cell key={row.paymentMethod} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => fmtCurrency(Number(value ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Số lịch theo phương thức</h3>
          <div className="mt-4 h-64">
            {methodData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu thanh toán thành công.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="paidBookings" name="Lịch đã thanh toán" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: '/doctor/slots', icon: 'schedule', title: 'Lịch trống', desc: 'Tạo và cập nhật khung giờ khám.' },
          { href: '/doctor/bookings', icon: 'event_note', title: 'Lịch hẹn', desc: 'Duyệt/ghi chú các lịch hẹn.' },
          { href: '/doctor/profile', icon: 'stethoscope', title: 'Hồ sơ', desc: 'Cập nhật thông tin hành nghề.' },
        ].map((c) => (
          <Link
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted"
            href={c.href}
            key={c.href}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{c.icon}</span>
              <p className="font-bold text-foreground">{c.title}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

