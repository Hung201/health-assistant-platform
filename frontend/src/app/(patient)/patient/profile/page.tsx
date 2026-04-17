'use client';

import { useMemo, useState } from 'react';
import { usersApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <input
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function PatientProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const initial = useMemo(() => {
    const p = user?.patientProfile ?? null;
    return {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      dateOfBirth: user?.dateOfBirth ?? '',
      gender: user?.gender ?? '',
      emergencyContactName: p?.emergencyContactName ?? '',
      emergencyContactPhone: p?.emergencyContactPhone ?? '',
      addressLine: p?.addressLine ?? '',
      provinceCode: p?.provinceCode ?? '',
      districtCode: p?.districtCode ?? '',
      wardCode: p?.wardCode ?? '',
      occupation: p?.occupation ?? '',
      bloodType: p?.bloodType ?? '',
    };
  }, [user]);

  const [form, setForm] = useState(initial);

  // Keep form in sync when user changes (e.g. after upload avatar / login).
  if (
    form.fullName === '' &&
    initial.fullName !== '' &&
    user?.fullName &&
    savedAt == null
  ) {
    // best-effort hydration for first render; avoid heavy effects
    // eslint-disable-next-line react-hooks/rules-of-hooks
    setForm(initial);
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Hồ sơ</h2>
        <p className="text-sm text-muted-foreground">Cập nhật hồ sơ bệnh nhân và thông tin liên hệ.</p>
      </header>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-muted">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Avatar" className="h-full w-full object-cover" src={user.avatarUrl} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">—</div>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Ảnh đại diện</div>
              <div className="text-xs text-muted-foreground">JPG/PNG/WebP, tối đa 5MB</div>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
            {uploading ? 'Đang tải…' : 'Đổi ảnh'}
            <input
              className="hidden"
              disabled={uploading}
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setError(null);
                setUploading(true);
                try {
                  await usersApi.uploadAvatar(file);
                  const me = await usersApi.me();
                  setSession({ user: me });
                  toast.show({ variant: 'success', title: 'Thành công', message: 'Đã cập nhật ảnh đại diện.' });
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Upload thất bại');
                  toast.show({ variant: 'error', title: 'Thất bại', message: 'Không thể cập nhật ảnh đại diện.' });
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}

        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">Thông tin cơ bản</div>
                <div className="text-xs text-muted-foreground">Tên, giới tính, ngày sinh</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Họ tên"
                value={form.fullName}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, fullName: v }))}
                placeholder="Nguyễn Văn A"
              />
              <label className="block">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</div>
                <input
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                  disabled
                  value={user?.email ?? ''}
                />
              </label>
              <Field
                label="Số điện thoại"
                value={form.phone}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
                placeholder="09xxxxxxxx"
              />
              <Field
                label="Ngày sinh"
                type="date"
                value={form.dateOfBirth}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, dateOfBirth: v }))}
              />
              <label className="block">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Giới tính</div>
                <select
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={saving}
                  value={form.gender}
                  onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))}
                >
                  <option value="">—</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                  <option value="unknown">Không muốn trả lời</option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <div className="mb-3">
              <div className="text-sm font-semibold text-foreground">Liên hệ</div>
              <div className="text-xs text-muted-foreground">Địa chỉ, khu vực</div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Địa chỉ"
                value={form.addressLine}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, addressLine: v }))}
                placeholder="Số nhà, đường…"
              />
              <Field
                label="Tỉnh/Thành (code)"
                value={form.provinceCode}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, provinceCode: v }))}
                placeholder="01"
              />
              <Field
                label="Quận/Huyện (code)"
                value={form.districtCode}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, districtCode: v }))}
                placeholder="001"
              />
              <Field
                label="Phường/Xã (code)"
                value={form.wardCode}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, wardCode: v }))}
                placeholder="00001"
              />
            </div>
          </section>

          <section>
            <div className="mb-3">
              <div className="text-sm font-semibold text-foreground">Khẩn cấp</div>
              <div className="text-xs text-muted-foreground">Người liên hệ khi cần</div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Tên liên hệ khẩn cấp"
                value={form.emergencyContactName}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, emergencyContactName: v }))}
                placeholder="Nguyễn Thị B"
              />
              <Field
                label="SĐT liên hệ khẩn cấp"
                value={form.emergencyContactPhone}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, emergencyContactPhone: v }))}
                placeholder="09xxxxxxxx"
              />
            </div>
          </section>

          <section>
            <div className="mb-3">
              <div className="text-sm font-semibold text-foreground">Thông tin y tế</div>
              <div className="text-xs text-muted-foreground">Nghề nghiệp, nhóm máu</div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Nghề nghiệp"
                value={form.occupation}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, occupation: v }))}
                placeholder="Sinh viên / Nhân viên…"
              />
              <Field
                label="Nhóm máu"
                value={form.bloodType}
                disabled={saving}
                onChange={(v) => setForm((s) => ({ ...s, bloodType: v }))}
                placeholder="A+, O-, …"
              />
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {savedAt ? `Đã lưu lúc ${new Date(savedAt).toLocaleTimeString()}` : 'Hãy bấm Lưu để cập nhật thay đổi.'}
            </div>
            <button
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="button"
              onClick={async () => {
                setError(null);
                setSaving(true);
                try {
                  const payload = {
                    fullName: form.fullName.trim(),
                    phone: form.phone.trim() || null,
                    dateOfBirth: form.dateOfBirth || null,
                    gender: form.gender || null,
                    patientProfile: {
                      emergencyContactName: form.emergencyContactName.trim() || null,
                      emergencyContactPhone: form.emergencyContactPhone.trim() || null,
                      addressLine: form.addressLine.trim() || null,
                      provinceCode: form.provinceCode.trim() || null,
                      districtCode: form.districtCode.trim() || null,
                      wardCode: form.wardCode.trim() || null,
                      occupation: form.occupation.trim() || null,
                      bloodType: form.bloodType.trim() || null,
                    },
                  };
                  const res = await usersApi.updateMe(payload);
                  setSession({ user: res.user });
                  setSavedAt(Date.now());
                  toast.show({ variant: 'success', title: 'Đã lưu', message: 'Cập nhật hồ sơ thành công.' });
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Lưu thất bại');
                  toast.show({ variant: 'error', title: 'Thất bại', message: 'Không thể lưu hồ sơ. Vui lòng thử lại.' });
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
    </div>
  );
}

