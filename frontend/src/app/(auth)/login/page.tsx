'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
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
  const passwordResetOk = searchParams.get('reset') === '1';
  const setSession = useAuthStore((s) => s.setSession);
  const { setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  // Khớp message backend AuthService.login (patient chưa email_verified_at)
  const showVerifyEmailCta = Boolean(errorMessage?.includes('chưa xác thực email'));

  const verifyHref = (() => {
    const e = email.trim().toLowerCase();
    return e ? `/register/verify?email=${encodeURIComponent(e)}` : '/register/verify';
  })();

  return (
    <div className="force-light scheme-light flex min-h-screen items-center justify-center bg-slate-50/50 p-4 sm:p-6 font-sans text-slate-900">
      <div className="relative flex w-full max-w-[1100px] min-h-[600px] overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_40px_rgb(0,0,0,0.08)] ring-1 ring-slate-200/50">
        <div className="absolute right-6 top-6 z-50 hidden lg:block pointer-events-auto">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105"
            href="/"
          >
            <ArrowLeft size={16} />
            Trang chủ
          </Link>
        </div>
        <div className="absolute right-4 top-4 z-50 lg:hidden pointer-events-auto">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur-md transition-all hover:bg-slate-200"
            href="/"
          >
            <ArrowLeft size={16} />
            Trang chủ
          </Link>
        </div>
        
        {/* Form Side */}
        <div className="w-full p-6 sm:p-8 md:p-12 lg:w-[55%] xl:w-1/2 flex flex-col justify-center bg-white">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg shadow-teal-500/30">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <Link className="text-2xl font-extrabold tracking-tight text-slate-900" href="/">
              Clinical Precision
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-black tracking-tight text-slate-900">Chào mừng trở lại</h2>
            <p className="text-slate-500 text-sm font-medium">
              Đăng nhập để tiếp tục quản lý sức khỏe và lịch hẹn của bạn.
            </p>
          </div>

          {passwordResetOk ? (
            <div className="mb-8 rounded-2xl border border-teal-100 bg-teal-50/50 p-5 text-sm font-medium text-teal-800">
              Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-8 rounded-2xl border border-red-100 bg-red-50/50 p-5 text-sm font-medium text-red-800">
              <p>{errorMessage}</p>
              {showVerifyEmailCta ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-red-600/80 font-normal">
                    Nhập đúng email ở trên, rồi mở trang xác thực để nhập mã 6 số.
                  </p>
                  <Link
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-red-100 px-4 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-200"
                    href={verifyHref}
                  >
                    Xác thực email
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate({ email, password });
            }}
          >
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700" htmlFor="email">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <User size={20} strokeWidth={2.5} />
                </div>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 py-3 pl-12 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-700" htmlFor="password">
                  Mật khẩu
                </label>
                <Link className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors" href="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Lock size={20} strokeWidth={2.5} />
                </div>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 py-3 pl-12 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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
                  {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <div className="flex items-center text-sm pt-1">
              <label className="flex cursor-pointer items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-200 bg-white checked:border-teal-500 checked:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2 transition-all"
                    name="remember"
                    type="checkbox"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="font-semibold text-slate-600 select-none">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <button
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:pointer-events-none disabled:opacity-70 overflow-hidden"
              disabled={loginMutation.isPending}
              type="submit"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">{loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập vào tài khoản'}</span>
            </button>
          </form>

          <div className="mt-8">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-slate-100" />
              </div>
              <span className="relative bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-400">Hoặc tiếp tục với</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <a
                className="group flex items-center justify-center gap-3 rounded-xl border-2 border-slate-100 bg-white py-3.5 px-4 transition-all hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
                href={`/api/auth/google?next=${encodeURIComponent(nextParam || '/app')}`}
              >
                <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.47-1.92 4.64-1.2 1.2-3.08 2.4-6.44 2.4-5.12 0-9.28-4.16-9.28-9.28s4.16-9.28 9.28-9.28c2.8 0 4.92 1.08 6.44 2.52l2.36-2.36C18.68 1.08 15.84 0 12.48 0 6.16 0 1 5.16 1 11.48S6.16 22.96 12.48 22.96c3.48 0 6.12-1.16 8.2-3.32 2.12-2.12 2.84-5.12 2.84-7.68 0-.56-.04-1.12-.12-1.64h-10.92z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-bold text-slate-700">Đăng nhập với Google</span>
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Chưa có tài khoản?{' '}
            <Link className="font-bold text-teal-600 hover:text-teal-700 transition-colors" href="/register">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Beautiful Abstract Right Side */}
        <div className="relative hidden lg:w-[45%] xl:w-1/2 overflow-hidden lg:block bg-[#0f172a]">
          {/* Abstract background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0a2724] to-slate-900 z-0" />
          <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[800px] h-[800px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[800px] h-[800px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none mix-blend-screen" />
          
          <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay z-0 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

          <div className="absolute inset-0 z-10 flex flex-col items-start justify-center p-12 xl:p-16 text-white">
            <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-white/5 p-3 border border-white/10 backdrop-blur-xl shadow-2xl">
              <Activity size={32} className="text-teal-400" strokeWidth={2} />
            </div>
            
            <h3 className="text-3xl xl:text-4xl font-black mb-4 leading-[1.2] tracking-tight">
              Sức khỏe của bạn,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">
                Ưu tiên của chúng tôi.
              </span>
            </h3>
            
            <p className="text-slate-300 text-base xl:text-lg leading-relaxed max-w-sm font-medium">
              Nền tảng quản lý y tế thông minh tích hợp AI, mang đến trải nghiệm chăm sóc sức khỏe liền mạch và chính xác.
            </p>
            
            <div className="mt-12 grid grid-cols-2 gap-5 w-full max-w-sm">
              <div className="group rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
                <div className="text-3xl font-black text-white mb-1 tracking-tight">98%</div>
                <div className="text-teal-200/80 text-xs font-bold uppercase tracking-wider">Độ chính xác AI</div>
              </div>
              <div className="group rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
                <div className="text-3xl font-black text-white mb-1 tracking-tight">24/7</div>
                <div className="text-teal-200/80 text-xs font-bold uppercase tracking-wider">Hỗ trợ liên tục</div>
              </div>
            </div>
            
            <div className="mt-12 flex items-center gap-4 bg-white/5 p-2.5 pr-5 rounded-full border border-white/10 backdrop-blur-md w-fit">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#0a1e1b] bg-slate-800 flex items-center justify-center shadow-lg"><User size={16} className="text-slate-400" /></div>
                <div className="w-10 h-10 rounded-full border-2 border-[#0a1e1b] bg-teal-800 flex items-center justify-center shadow-lg"><Activity size={16} className="text-teal-200" /></div>
                <div className="w-10 h-10 rounded-full border-2 border-[#0a1e1b] bg-emerald-800 flex items-center justify-center shadow-lg"><Lock size={16} className="text-emerald-200" /></div>
              </div>
              <div className="text-sm font-medium text-slate-300">
                Tham gia cùng <span className="text-white font-bold">10,000+</span> người dùng
              </div>
            </div>
          </div>
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
