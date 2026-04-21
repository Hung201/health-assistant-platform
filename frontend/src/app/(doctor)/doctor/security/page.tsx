'use client';

import { useState } from 'react';
import { usersApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Lock, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

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
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <input
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-slate-400"
        disabled={disabled}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function DoctorSecurityPage() {
  const toast = useToast();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <header className="text-center mb-10">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-sm">
          <Lock size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground">Cài đặt bảo mật</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Đổi mật khẩu và tăng cường bảo vệ tài khoản bác sĩ của bạn.
        </p>
      </header>

      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-border">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-foreground">Đổi mật khẩu</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                Nếu bạn đăng nhập bằng Google, có thể để trống mật khẩu hiện tại để tạo mật khẩu lần đầu.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Field
              label="Mật khẩu hiện tại (tuỳ chọn)"
              type="password"
              value={pw.current}
              disabled={saving}
              onChange={(v) => setPw((s) => ({ ...s, current: v }))}
              placeholder="••••••••"
            />
            <div className="w-full h-px bg-border my-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-muted border border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Yêu cầu mật khẩu an toàn:</h4>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className={pw.next.length >= 8 ? 'text-emerald-500' : 'text-slate-300'} />
                Tối thiểu 8 ký tự
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  size={16}
                  className={pw.next.length > 0 && pw.next === pw.confirm ? 'text-emerald-500' : 'text-slate-300'}
                />
                Mật khẩu xác nhận phải khớp
              </li>
            </ul>
          </div>
        </div>

        <div className="p-8 sm:p-10 bg-muted/40 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldAlert size={16} /> Thông tin tài khoản được bảo vệ bằng cơ chế mã hóa.
          </div>
          <button
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:transform-none"
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
                toast.show({ variant: 'success', title: 'Thành công', message: 'Đã cập nhật mật khẩu mới an toàn.' });
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
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              'Cập nhật mật khẩu'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
