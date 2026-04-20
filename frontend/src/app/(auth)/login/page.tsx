'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { authApi, usersApi } from '@/lib/api';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop';

const ease = 'ease-out';
const dur = 'duration-200';

const fieldInputClass = `w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pl-10 text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] ${dur} ${ease} focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`;
const labelFieldClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1';
const btnPrimaryClass = `w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-base font-bold text-white shadow-sm transition-all ${dur} ${ease} hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary disabled:hover:shadow-sm disabled:active:scale-100`;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const pickRedirect = (roles: string[], next: string | null) => {
    const canGo =
      typeof next === 'string' &&
      next.startsWith('/') &&
      !next.startsWith('//') &&
      (() => {
        if (next.startsWith('/admin')) return roles.includes('admin');
        if (next.startsWith('/doctor')) return roles.includes('doctor');
        if (next.startsWith('/patient')) return roles.includes('patient');
        if (next.startsWith('/app')) return roles.some((r) => ['admin', 'doctor', 'patient'].includes(r));
        return true; // public pages
      })();

    if (canGo && next) return next;
    if (roles.includes('admin')) return '/admin';
    if (roles.includes('doctor')) return '/doctor';
    if (roles.includes('patient')) return '/patient';
    return '/';
  };

  const loginMutation = useMutation({
    mutationFn: ({ email: e, password: p }: { email: string; password: string }) =>
      authApi.login(e, p),
    onSuccess: async () => {
      const me = await usersApi.me();
      setSession({ user: me });
      syncAuthToLegacyStorage({ accessToken: null, user: me });
      const dest = pickRedirect(me.roles ?? [], nextParam);
      router.push(dest);
      router.refresh();
    },
  });

  const errorMessage =
    loginMutation.error instanceof Error
      ? loginMutation.error.message
      : loginMutation.isError
        ? 'Đăng nhập thất bại'
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 font-sans p-4">
      <div className="relative flex w-full max-w-[1000px] overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/50">
        <div className="absolute right-4 top-4 z-50 pointer-events-auto">
          <Link
            className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            href="/"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Trang chủ
          </Link>
        </div>
        <div className="w-full p-8 md:p-12 lg:w-1/2 flex flex-col justify-center">
          <div className="mb-8 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <span className="material-symbols-outlined text-[24px]">medical_services</span>
            </div>
            <Link className="text-xl font-bold tracking-tight text-slate-900" href="/">
              Clinical Precision
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-bold text-slate-900">Chào mừng trở lại</h2>
            <p className="text-slate-500">
              Đăng nhập để tiếp tục quản lý sức khỏe và lịch hẹn của bạn.
            </p>
          </div>

          {errorMessage ? (
            <div
              className={`mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 transition-opacity ${dur} ${ease}`}
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate({ email, password });
            }}
          >
            <div>
              <label className={labelFieldClass} htmlFor="email">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
                <input
                  autoComplete="email"
                  className={fieldInputClass}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div>
              <label className={labelFieldClass} htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </div>
                <input
                  autoComplete="current-password"
                  className={fieldInputClass}
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
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center">
                <input
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  name="remember"
                  type="checkbox"
                />
                <span className="ml-2 text-slate-600">Ghi nhớ đăng nhập</span>
              </label>
              <Link className="font-bold text-primary hover:underline transition-colors" href="#">
                Quên mật khẩu?
              </Link>
            </div>

            <div className="pt-2">
              <button
                className={btnPrimaryClass}
                disabled={loginMutation.isPending}
                type="submit"
              >
                {loginMutation.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
                <span className="material-symbols-outlined text-[18px]">login</span>
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-xs uppercase tracking-wider font-semibold text-slate-400">Hoặc tiếp tục với</span>
            </div>
            <div className="grid grid-cols-1">
              <a
                className={`flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 px-4 transition-all ${dur} ${ease} hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]`}
                href={`/api/auth/google?next=${encodeURIComponent(nextParam || '/app')}`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.47-1.92 4.64-1.2 1.2-3.08 2.4-6.44 2.4-5.12 0-9.28-4.16-9.28-9.28s4.16-9.28 9.28-9.28c2.8 0 4.92 1.08 6.44 2.52l2.36-2.36C18.68 1.08 15.84 0 12.48 0 6.16 0 1 5.16 1 11.48S6.16 22.96 12.48 22.96c3.48 0 6.12-1.16 8.2-3.32 2.12-2.12 2.84-5.12 2.84-7.68 0-.56-.04-1.12-.12-1.64h-10.92z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-semibold text-slate-700">Google</span>
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link className="font-bold text-primary hover:underline transition-colors" href="/register">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <div className="relative hidden w-1/2 overflow-hidden lg:block bg-primary/5">
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/40 to-transparent mix-blend-multiply" />
          <img
            alt="Bác sĩ đang sử dụng công nghệ AI để chẩn đoán"
            className="h-full w-full object-cover opacity-90"
            src={HERO_IMAGE}
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent">
            <h3 className="text-3xl font-bold mb-4">Trí tuệ nhân tạo hỗ trợ sàng lọc bệnh</h3>
            <p className="text-slate-200 text-sm leading-relaxed max-w-sm">
              Clinical Precision sử dụng các thuật toán tiên tiến nhất để giúp bạn theo dõi và sàng lọc các dấu hiệu sức khỏe sớm một cách chính xác nhất.
            </p>
            
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
                <span className="material-symbols-outlined text-[16px]">monitoring</span>
                <span className="text-xs font-bold uppercase tracking-wider">AI Sàng lọc chuẩn 98%</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span className="text-xs font-bold uppercase tracking-wider">200+ Đối tác bệnh viện</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
