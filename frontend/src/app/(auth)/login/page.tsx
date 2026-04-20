'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { User, Lock, Eye, EyeOff, Activity, ArrowLeft } from 'lucide-react';

import { authApi, usersApi } from '@/lib/api';
import { isAdminUser } from '@/lib/auth';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC-wsAzrANdti2F347u__dOveI66sI4mBuOdZo7Ru6Sj273HhkwAhBBO66ANG3vpXXetlM_wWSis_Uk6EyDXkK3GSef947upzxP6FVTlzzltSy3FZqJ-t9e2v8D-fgb_vkRA0JkvHy7_u_IUXGov9G80MRtaJf8xSOWSsyKWVrHGVXpO3Z0AQfU9Wqak_RdRtUfScAlQGTenX_vDraSsLfzqqVEkdqzABGiGd3S-jYEiUY6CUFFqHGCZeMU8eD9mIAHRc1Zkv6ntwFR';

function LoginPageContent() {
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
    <div className="flex min-h-screen items-center justify-center bg-[#eefaf8] p-4 font-sans">
      <div className="relative flex w-full max-w-[1000px] overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-xl shadow-slate-200/50">
        <div className="absolute right-4 top-4 z-50 pointer-events-auto">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm transition-colors hover:bg-slate-50"
            href="/"
          >
            <ArrowLeft size={16} />
            Trang chủ
          </Link>
        </div>
        
        <div className="w-full p-8 md:p-12 lg:w-1/2">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500 text-white">
              <Activity size={24} />
            </div>
            <Link className="text-2xl font-bold tracking-tight text-slate-800" href="/">
              Clinical Precision
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-extrabold text-slate-800">Chào mừng trở lại</h2>
            <p className="text-slate-500 text-sm">
              Đăng nhập để tiếp tục quản lý sức khỏe và lịch hẹn của bạn.
            </p>
          </div>

          {errorMessage ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
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
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <User size={20} strokeWidth={2} />
                </div>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-teal-100 bg-[#f4fcfb] py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-transparent focus:ring-2 focus:ring-teal-500"
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@precision.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Lock size={20} strokeWidth={2} />
                </div>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-teal-100 bg-[#f4fcfb] py-3.5 pl-12 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-transparent focus:ring-2 focus:ring-teal-500"
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  className="h-4 w-4 rounded border-teal-200 text-teal-600 focus:ring-teal-500"
                  name="remember"
                  type="checkbox"
                />
                <span className="text-slate-500 font-medium">Ghi nhớ đăng nhập</span>
              </label>
              <Link className="font-bold text-teal-600 hover:text-teal-700" href="#">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#71d4c8] px-4 py-4 font-bold text-white shadow-sm transition-all hover:bg-[#5bc2b6] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loginMutation.isPending}
              type="submit"
            >
              {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <span className="relative bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Hoặc tiếp tục với</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <a
                className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 px-4 transition-colors hover:bg-slate-50"
                href={`/api/auth/google?next=${encodeURIComponent(nextParam || '/app')}`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.47-1.92 4.64-1.2 1.2-3.08 2.4-6.44 2.4-5.12 0-9.28-4.16-9.28-9.28s4.16-9.28 9.28-9.28c2.8 0 4.92 1.08 6.44 2.52l2.36-2.36C18.68 1.08 15.84 0 12.48 0 6.16 0 1 5.16 1 11.48S6.16 22.96 12.48 22.96c3.48 0 6.12-1.16 8.2-3.32 2.12-2.12 2.84-5.12 2.84-7.68 0-.56-.04-1.12-.12-1.64h-10.92z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-bold text-slate-700">Google</span>
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link className="font-bold text-teal-600 hover:text-teal-700" href="/register">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <div className="relative hidden w-1/2 overflow-hidden bg-teal-50 lg:block">
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-teal-500/10 to-transparent" />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-8 w-full max-w-md">
              <div className="relative aspect-[3/4] max-h-[380px] w-full overflow-hidden rounded-2xl shadow-2xl shadow-teal-900/20">
                <img
                  alt="Bác sĩ đang sử dụng công nghệ AI để chẩn đoán"
                  className="h-full w-full object-cover opacity-95"
                  src={HERO_IMAGE}
                />
              </div>

              <div className="absolute -right-6 top-10 z-30 animate-pulse rounded-xl border border-white/40 bg-white/90 p-4 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3 text-teal-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                    <Activity size={16} />
                  </div>
                  <span className="text-sm font-bold">AI Sàng lọc chuẩn 98%</span>
                </div>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <h3 className="text-2xl font-extrabold text-slate-800">Trí tuệ nhân tạo hỗ trợ sàng lọc bệnh</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Clinical Precision sử dụng các thuật toán tiên tiến nhất để giúp bạn theo dõi và sàng lọc các dấu hiệu sức khỏe sớm một cách chính xác nhất.
              </p>
            </div>
          </div>

          <div className="absolute -right-32 -top-32 z-0 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 z-0 h-96 w-96 rounded-full bg-teal-300/30 blur-3xl" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#eefaf8] text-sm text-slate-600">Đang tải...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
