'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { authApi, usersApi } from '@/lib/api';
import { isAdminUser } from '@/lib/auth';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC-wsAzrANdti2F347u__dOveI66sI4mBuOdZo7Ru6Sj273HhkwAhBBO66ANG3vpXXetlM_wWSis_Uk6EyDXkK3GSef947upzxP6FVTlzzltSy3FZqJ-t9e2v8D-fgb_vkRA0JkvHy7_u_IUXGov9G80MRtaJf8xSOWSsyKWVrHGVXpO3Z0AQfU9Wqak_RdRtUfScAlQGTenX_vDraSsLfzqqVEkdqzABGiGd3S-jYEiUY6CUFFqHGCZeMU8eD9mIAHRc1Zkv6ntwFR';

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
    <div className="force-light flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="relative flex w-full max-w-[1000px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="absolute right-3 top-3 z-50 pointer-events-auto">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            href="/"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Trang chủ
          </Link>
        </div>
        <div className="w-full p-8 md:p-12 lg:w-1/2">
          <div className="mb-8 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <span className="material-symbols-outlined text-3xl">medical_services</span>
            </div>
            <Link className="text-xl font-bold tracking-tight text-primary" href="/">
              MediSmart AI
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-bold">Chào mừng trở lại</h2>
            <p className="text-muted-foreground">
              Đăng nhập để tiếp tục quản lý sức khỏe và lịch hẹn của bạn.
            </p>
          </div>

          {errorMessage ? (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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
              <label className="mb-2 block text-sm font-semibold" htmlFor="email">
                Email
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <input
                  autoComplete="email"
                  className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary"
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="password">
                Mật khẩu
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-12 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary"
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
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center">
                <input
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  name="remember"
                  type="checkbox"
                />
                <span className="ml-2 text-muted-foreground">Ghi nhớ đăng nhập</span>
              </label>
              <Link className="font-semibold text-primary hover:underline" href="#">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loginMutation.isPending}
              type="submit"
            >
              {loginMutation.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
              <span className="material-symbols-outlined text-lg">login</span>
            </button>
          </form>

          <div className="mt-8">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-3 text-sm text-muted-foreground">Hoặc tiếp tục với</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <a
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2 px-4 transition-colors hover:bg-muted"
                href={`/api/auth/google?next=${encodeURIComponent(nextParam || '/app')}`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.47-1.92 4.64-1.2 1.2-3.08 2.4-6.44 2.4-5.12 0-9.28-4.16-9.28-9.28s4.16-9.28 9.28-9.28c2.8 0 4.92 1.08 6.44 2.52l2.36-2.36C18.68 1.08 15.84 0 12.48 0 6.16 0 1 5.16 1 11.48S6.16 22.96 12.48 22.96c3.48 0 6.12-1.16 8.2-3.32 2.12-2.12 2.84-5.12 2.84-7.68 0-.56-.04-1.12-.12-1.64h-10.92z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-medium">Google</span>
              </a>
              <button
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2 px-4 transition-colors hover:bg-muted"
                type="button"
              >
                <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="font-medium">Facebook</span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link className="font-bold text-primary hover:underline" href="/register">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <div className="relative hidden min-h-[560px] w-1/2 overflow-hidden bg-muted lg:block">
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-primary/20 to-transparent" />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-8 w-full max-w-md">
              <div className="relative aspect-[3/4] max-h-[380px] w-full overflow-hidden rounded-xl shadow-xl">
                <img
                  alt="Bác sĩ đang sử dụng công nghệ AI để chẩn đoán"
                  className="h-full w-full object-cover opacity-90"
                  src={HERO_IMAGE}
                />
                <div className="absolute inset-0 bg-primary opacity-20 mix-blend-multiply" />
              </div>

              <div className="absolute -right-2 top-6 z-30 animate-pulse rounded-lg border border-border bg-card/90 p-4 shadow-lg backdrop-blur sm:right-4">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">monitoring</span>
                  <span className="text-sm font-bold">AI Sàng lọc chuẩn 98%</span>
                </div>
              </div>
              <div className="absolute -left-2 bottom-6 z-30 rounded-lg border border-border bg-card/90 p-4 shadow-lg backdrop-blur sm:left-4">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">verified</span>
                  <span className="text-sm font-bold">200+ Đối tác bệnh viện</span>
                </div>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Trí tuệ nhân tạo hỗ trợ sàng lọc bệnh</h3>
              <p className="text-muted-foreground">
                MediSmart AI sử dụng các thuật toán tiên tiến nhất để giúp bạn theo dõi và sàng lọc các dấu hiệu sức
                khỏe sớm một cách chính xác nhất.
              </p>
            </div>
          </div>

          <div className="absolute -right-32 -top-32 z-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 z-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        </div>
      </div>
    </div>
  );
}
