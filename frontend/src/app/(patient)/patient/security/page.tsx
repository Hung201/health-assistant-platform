'use client';

import { useState } from 'react';
import { usersApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

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

export default function PatientSecurityPage() {
  const toast = useToast();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Bảo mật</h2>
        <p className="text-sm text-muted-foreground">Đổi mật khẩu và bảo vệ tài khoản của bạn.</p>
      </header>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <div className="text-sm font-semibold text-foreground">Đổi mật khẩu</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Nếu bạn tạo tài khoản bằng Google, bạn có thể để trống mật khẩu hiện tại để đặt mật khẩu lần đầu.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Mật khẩu hiện tại (tuỳ chọn)"
            type="password"
            value={pw.current}
            disabled={saving}
            onChange={(v) => setPw((s) => ({ ...s, current: v }))}
            placeholder="••••••••"
          />
          <div />
          <Field
            label="Mật khẩu mới"
            type="password"
            value={pw.next}
            disabled={saving}
            onChange={(v) => setPw((s) => ({ ...s, next: v }))}
            placeholder="Tối thiểu 8 ký tự"
          />
          <Field
            label="Nhập lại mật khẩu mới"
            type="password"
            value={pw.confirm}
            disabled={saving}
            onChange={(v) => setPw((s) => ({ ...s, confirm: v }))}
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        <div className="mt-5 flex items-center justify-end">
          <button
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            type="button"
            onClick={async () => {
              if (pw.next.trim().length < 8) {
                toast.show({ variant: 'error', title: 'Không hợp lệ', message: 'Mật khẩu mới phải >= 8 ký tự.' });
                return;
              }
              if (pw.next !== pw.confirm) {
                toast.show({ variant: 'error', title: 'Không khớp', message: 'Xác nhận mật khẩu không khớp.' });
                return;
              }
              setSaving(true);
              try {
                await usersApi.changePassword({
                  currentPassword: pw.current.trim() ? pw.current : undefined,
                  newPassword: pw.next,
                });
                setPw({ current: '', next: '', confirm: '' });
                toast.show({ variant: 'success', title: 'Thành công', message: 'Đã đổi mật khẩu.' });
              } catch (err) {
                toast.show({
                  variant: 'error',
                  title: 'Thất bại',
                  message: err instanceof Error ? err.message : 'Không thể đổi mật khẩu.',
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Đang đổi…' : 'Đổi mật khẩu'}
          </button>
        </div>
      </div>
    </div>
  );
}

