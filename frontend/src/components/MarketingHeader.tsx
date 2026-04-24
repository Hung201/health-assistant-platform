'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function MarketingHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const aiHref = user ? '/patient/ai-assistant' : '/ai';

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 bg-white border-b border-transparent ${scrolled ? 'navbar-scrolled' : 'border-slate-100'}`}>
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2" href="/">
          <div className="rounded-[10px] bg-[#0D9E75] p-1.5 text-white">
            <Activity size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0D9E75]" href={aiHref}>AI Phân Tích</Link>
          <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0D9E75]" href="/doctors">Danh Bạ Bác Sĩ</Link>
          <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0D9E75]" href="/blog">Blog Y Khoa</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100" href={appHref}>Vào ứng dụng</Link>
              <button
                className="btn-primary !py-2 !px-5 text-sm"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                type="button"
              >
                {logoutMutation.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
              </button>
            </>
          ) : (
            <>
              <Link className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100" href="/login">Đăng nhập</Link>
              <Link className="btn-primary !py-2 !px-5 text-sm" href="/register">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
