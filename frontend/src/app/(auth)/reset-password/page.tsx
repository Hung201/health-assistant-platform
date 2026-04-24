'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Activity, ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';

import { authApi } from '@/lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { setTheme } = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
    const previous: 'light' | 'dark' | 'system' | null =
      raw === 'light' || raw === 'dark' || raw === 'system' ? raw : null;
    setTheme('light');
    return () => {
      if (previous) setTheme(previous);
      else setTheme('system');
    };
  }, [setTheme]);

  const mutation = useMutation({
    mutationFn: () => authApi.resetPassword(token, password),
    onSuccess: () => {
      router.push('/login?reset=1');
      router.refresh();
    },
  });

  const errorMessage =
    localError ||
    (mutation.error instanceof Error
      ? mutation.error.message
      : mutation.isError
        ? 'Đặt lại mật khẩu thất bại'
        : null);

  const invalidLink = !token;

  return (
    <div className="force-light scheme-light flex min-h-screen items-center justify-center bg-[#eefaf8] p-4 font-sans text-slate-900">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-teal-100 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-10">
        <div className="absolute right-4 top-4 z-50">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm transition-colors hover:bg-slate-50"
            href="/login"
          >
            <ArrowLeft size={16} />
            Đăng nhập
          </Link>
        </div>

        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white">
            <Activity size={24} />
          </div>
          <Link className="text-xl font-bold tracking-tight text-slate-800" href="/">
            Clinical Precision
          </Link>
        </div>

        <h1 className="mb-2 text-2xl font-extrabold text-slate-800">Đặt lại mật khẩu</h1>
        <p className="mb-6 text-sm text-slate-500">Chọn mật khẩu mới cho tài khoản của bạn.</p>

        {invalidLink ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-bold">Thiếu liên kết hợp lệ</p>
            <p className="mt-2">Mở liên kết từ email hoặc yêu cầu gửi lại từ trang quên mật khẩu.</p>
            <Link className="mt-3 inline-block font-bold text-teal-700 hover:text-teal-900" href="/forgot-password">
              Quên mật khẩu
            </Link>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setLocalError(null);
              if (password.length < 6) {
                setLocalError('Mật khẩu tối thiểu 6 ký tự');
                return;
              }
              if (password !== confirm) {
                setLocalError('Mật khẩu xác nhận không khớp');
                return;
              }
              mutation.mutate();
            }}
          >
            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
            ) : null}

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="password">
                Mật khẩu mới
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Lock size={20} strokeWidth={2} />
                </div>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-teal-100 bg-[#f4fcfb] py-3.5 pl-12 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-teal-500"
                  id="password"
                  name="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-teal-600"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                htmlFor="confirm"
              >
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Lock size={20} strokeWidth={2} />
                </div>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-teal-100 bg-[#f4fcfb] py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-teal-500"
                  id="confirm"
                  name="confirm"
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                />
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#71d4c8] px-4 py-4 font-bold text-white shadow-sm transition-all hover:bg-[#5bc2b6] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link className="font-bold text-teal-600 hover:text-teal-700" href="/login">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#eefaf8] text-sm text-slate-600">Đang tải...</div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
