'use client';

import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function MarketingHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.refresh();
    },
  });

  const appHref = user?.roles?.includes('admin')
    ? '/admin'
    : user?.roles?.includes('doctor')
      ? '/doctor'
      : user
        ? '/patient'
        : '/login';

  return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2" href="/">
            <div className="rounded-lg bg-primary p-1.5 text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">medical_services</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</h1>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary" href="/ai-assistant">
              Trợ lý AI
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary" href="/doctors">
              Bác sĩ
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary" href="/blog">
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  href={appHref}
                >
                  Vào ứng dụng
                </Link>
                <button
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  type="button"
                >
                  {logoutMutation.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
                </button>
              </>
            ) : (
              <>
                <Link
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  href="/login"
                >
                  Đăng nhập
                </Link>
                <Link
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                  href="/register"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
  );
}

export function MarketingFooter() {
  return (
      <footer className="bg-slate-900 pt-16 pb-8 text-slate-300 mt-auto">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <div className="rounded-lg bg-primary p-1.5 text-white">
                  <span className="material-symbols-outlined text-[20px]">medical_services</span>
                </div>
                <h2 className="text-xl font-bold text-white">Clinical Precision</h2>
              </div>
              <p className="mb-6 max-w-sm text-sm text-slate-400 leading-relaxed">
                Nền tảng chăm sóc sức khỏe thông minh — hỗ trợ bạn chẩn đoán, đặt lịch khám và quản lý sức khỏe toàn diện bằng AI.
              </p>
            </div>
            <div>
              <h5 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">Nền tảng</h5>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Chẩn đoán AI</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Đặt lịch khám</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tư vấn trực tuyến</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Hồ sơ sức khỏe</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">Về chúng tôi</h5>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Đội ngũ bác sĩ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Điều khoản sử dụng</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-6 text-sm font-bold uppercase tracking-wider text-white">Hỗ trợ</h5>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Câu hỏi thường gặp</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© 2024 Clinical Precision. All rights reserved.</p>
            <div className="flex gap-4">
            </div>
          </div>
        </div>
      </footer>
  );
}
