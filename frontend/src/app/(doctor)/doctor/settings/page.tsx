'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/toast';
import {
  defaultDoctorPortalSettings,
  loadDoctorPortalSettings,
  saveDoctorPortalSettings,
  type DoctorPortalSettings,
} from '@/lib/doctor-settings';

export default function DoctorSettingsPage() {
  const toast = useToast();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const current = (theme === 'system' ? resolvedTheme : theme) ?? 'light';
  const isDark = current === 'dark';
  const [settings, setSettings] = useState<DoctorPortalSettings>(defaultDoctorPortalSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const currentSettings = loadDoctorPortalSettings();
    setSettings(currentSettings);
    setLoaded(true);
  }, []);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cài đặt</h2>
          <p className="text-sm text-muted-foreground">Tuỳ chỉnh nhanh giao diện cho khu vực bác sĩ.</p>
        </div>
        <Link className="self-start text-sm font-medium text-primary hover:underline sm:self-auto" href="/doctor">
          ← Tổng quan
        </Link>
      </div>

      <div className="w-full max-w-3xl rounded-xl border border-border bg-muted p-4 text-sm text-foreground sm:p-6">
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Giao diện</p>
            <p className="text-sm font-medium text-foreground">Bật/tắt chế độ sáng tối trong màn hình bác sĩ.</p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`self-start inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors sm:self-auto ${
              isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
            aria-label="Bật tắt chế độ sáng tối"
            title="Bật tắt chế độ sáng tối"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-amber-500'}`} />
            {isDark ? 'Đang bật tối' : 'Đang bật sáng'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nhắc lịch</p>
                <p className="text-sm font-medium text-foreground">Nhắc bác sĩ trước giờ khám để tránh bỏ sót lịch hẹn.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={settings.reminderEnabled}
                  onChange={(e) => setSettings((prev) => ({ ...prev, reminderEnabled: e.target.checked }))}
                />
                Bật nhắc lịch
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Nhắc trước:</span>
              {[15, 30, 60, 120].map((minute) => (
                <button
                  key={minute}
                  type="button"
                  disabled={!settings.reminderEnabled}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    settings.reminderLeadMinutes === minute
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                  onClick={() => setSettings((prev) => ({ ...prev, reminderLeadMinutes: minute }))}
                >
                  {minute} phút
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thông báo lịch mới</p>
            <p className="mt-1 text-sm font-medium text-foreground">Chọn kênh nhận thông báo khi có lịch hẹn mới được đặt.</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={settings.notifyByEmail}
                  onChange={(e) => setSettings((prev) => ({ ...prev, notifyByEmail: e.target.checked }))}
                />
                Email
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={settings.notifyBySms}
                  onChange={(e) => setSettings((prev) => ({ ...prev, notifyBySms: e.target.checked }))}
                />
                SMS
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mặc định khi tạo slot</p>
            <p className="mt-1 text-sm font-medium text-foreground">Áp dụng nhanh cho form tạo slot ở trang Lịch trống.</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Thời lượng mặc định
                </span>
                <select
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  value={settings.defaultSlotDurationMinutes}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultSlotDurationMinutes: Number(e.target.value),
                    }))
                  }
                >
                  {[15, 20, 30, 45, 60].map((minute) => (
                    <option key={minute} value={minute}>
                      {minute} phút
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Số lượt mặc định
                </span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  value={settings.defaultMaxBookings}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultMaxBookings: Math.min(50, Math.max(1, Number(e.target.value) || 1)),
                    }))
                  }
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button
            type="button"
            className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60 sm:w-auto"
            disabled={!loaded}
            onClick={() => {
              setSettings(defaultDoctorPortalSettings);
              saveDoctorPortalSettings(defaultDoctorPortalSettings);
              toast.show({ variant: 'info', title: 'Đã đặt lại', message: 'Cài đặt bác sĩ đã trở về mặc định.' });
            }}
          >
            Đặt lại mặc định
          </button>
          <button
            type="button"
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={!loaded}
            onClick={() => {
              saveDoctorPortalSettings(settings);
              toast.show({ variant: 'success', title: 'Đã lưu', message: 'Cài đặt bác sĩ đã được cập nhật.' });
            }}
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </>
  );
}
