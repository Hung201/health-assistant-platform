'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Activity, ArrowLeft, Mail } from 'lucide-react';

import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const { setTheme } = useTheme();
  const [email, setEmail] = useState('');

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
    mutationFn: () => authApi.forgotPassword(email),
  });

  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.isError
        ? 'Gửi yêu cầu thất bại'
        : null;

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

        <h1 className="mb-2 text-2xl font-extrabold text-slate-800">Quên mật khẩu?</h1>
        <p className="mb-6 text-sm text-slate-500">
          Nhập email đã đăng ký. Nếu tài khoản tồn tại, chúng tôi sẽ gửi liên kết đặt lại mật khẩu (kiểm tra cả hộp thư rác).
        </p>

        {mutation.isSuccess ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-900">
            <p className="font-bold">Đã gửi yêu cầu</p>
            <p className="mt-2 text-teal-800/90">
              Nếu email có trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút tới.
            </p>
            <Link
              className="mt-4 inline-flex font-bold text-teal-700 underline decoration-teal-400 underline-offset-2 hover:text-teal-900"
              href="/login"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
            ) : null}

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Mail size={20} strokeWidth={2} />
                </div>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-teal-100 bg-[#f4fcfb] py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-teal-500"
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#71d4c8] px-4 py-4 font-bold text-white shadow-sm transition-all hover:bg-[#5bc2b6] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
