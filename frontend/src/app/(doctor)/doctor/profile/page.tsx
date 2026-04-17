'use client';

import { useMemo, useState } from 'react';

import { usersApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';

export default function DoctorProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const toast = useToast();

  const initial = useMemo(() => {
    const d = user?.doctorProfile ?? null;
    return {
      professionalTitle: d?.professionalTitle ?? '',
      licenseNumber: d?.licenseNumber ?? '',
      yearsOfExperience: d?.yearsOfExperience != null ? String(d.yearsOfExperience) : '',
      workplaceName: d?.workplaceName ?? '',
      consultationFee: d?.consultationFee ?? '0',
      bio: d?.bio ?? '',
      isAvailableForBooking: d?.isAvailableForBooking ?? true,
    };
  }, [user]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Hồ sơ hành nghề</h2>
        <p className="text-sm text-muted-foreground">Cập nhật thông tin hành nghề để bệnh nhân dễ lựa chọn và đặt lịch.</p>
      </header>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Họ tên</div>
            <div className="mt-1 font-semibold text-foreground">{user?.fullName ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</div>
            <div className="mt-1 font-semibold text-foreground">{user?.email ?? '—'}</div>
          </div>
        </div>

        <div className="my-5 h-px w-full bg-border" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Chức danh</div>
            <input
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:opacity-70"
              value={form.professionalTitle}
              onChange={(e) => setForm((s) => ({ ...s, professionalTitle: e.target.value }))}
              placeholder="Ví dụ: BS CKI, ThS.BS…"
              disabled={saving}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">CCHN</div>
            <input
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:opacity-70"
              value={form.licenseNumber}
              onChange={(e) => setForm((s) => ({ ...s, licenseNumber: e.target.value }))}
              placeholder="Số chứng chỉ hành nghề"
              disabled={saving}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Năm kinh nghiệm</div>
            <input
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:opacity-70"
              value={form.yearsOfExperience}
              onChange={(e) => setForm((s) => ({ ...s, yearsOfExperience: e.target.value }))}
              placeholder="Ví dụ: 5"
              inputMode="numeric"
              disabled={saving}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Cơ sở công tác</div>
            <input
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:opacity-70"
              value={form.workplaceName}
              onChange={(e) => setForm((s) => ({ ...s, workplaceName: e.target.value }))}
              placeholder="Ví dụ: Clinical Precision Center"
              disabled={saving}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Phí tư vấn (₫)</div>
            <input
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:opacity-70"
              value={form.consultationFee}
              onChange={(e) => setForm((s) => ({ ...s, consultationFee: e.target.value }))}
              placeholder="Ví dụ: 250000"
              inputMode="numeric"
              disabled={saving}
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Cho phép đặt lịch</div>
              <div className="text-xs text-muted-foreground">Tắt nếu bạn đang tạm ngưng nhận lịch.</div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              checked={form.isAvailableForBooking}
              onChange={(e) => setForm((s) => ({ ...s, isAvailableForBooking: e.target.checked }))}
              disabled={saving}
            />
          </label>
        </div>

        <div className="mt-4">
          <label className="block">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Giới thiệu</div>
            <textarea
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:opacity-70"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
              placeholder="Mô tả ngắn về chuyên môn, thế mạnh, kinh nghiệm…"
              disabled={saving}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Trạng thái xác thực:{' '}
            <span className="font-semibold text-foreground">
              {user?.doctorProfile?.verificationStatus ?? '—'}
            </span>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const years =
                  form.yearsOfExperience.trim() === '' ? null : Number(form.yearsOfExperience.trim());
                const fee =
                  form.consultationFee.trim() === '' ? null : Number(form.consultationFee.trim());

                const res = await usersApi.updateMe({
                  doctorProfile: {
                    professionalTitle: form.professionalTitle.trim() || null,
                    licenseNumber: form.licenseNumber.trim() || null,
                    yearsOfExperience: Number.isFinite(years as number) ? (years as number) : null,
                    workplaceName: form.workplaceName.trim() || null,
                    consultationFee: Number.isFinite(fee as number) ? String(fee) : null,
                    bio: form.bio.trim() || null,
                    isAvailableForBooking: form.isAvailableForBooking,
                  } as any,
                });
                setSession({ user: res.user });
                toast.show({ variant: 'success', title: 'Đã lưu', message: 'Cập nhật hồ sơ hành nghề thành công.' });
              } catch (e) {
                toast.show({
                  variant: 'error',
                  title: 'Thất bại',
                  message: e instanceof Error ? e.message : 'Không thể lưu. Vui lòng thử lại.',
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

