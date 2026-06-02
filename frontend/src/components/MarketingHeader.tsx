'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  Activity, Menu, X, LogOut, LayoutDashboard, 
  Brain, Stethoscope, BookOpen, User 
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function MarketingHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
        {/* Logo */}
        <Link className="flex items-center gap-2" href="/" onClick={() => setIsOpen(false)}>
          <div className="rounded-[10px] bg-[#0D9E75] p-1.5 text-white">
            <Activity size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0D9E75]" href={aiHref}>AI Phân Tích</Link>
          <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0D9E75]" href="/doctors">Danh Bạ Bác Sĩ</Link>
          <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0D9E75]" href="/blog">Blog Y Khoa</Link>
        </nav>

        {/* Desktop Auth Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100" href={appHref}>Trang quản trị</Link>
              <button
                className="btn-primary !py-2 !px-5 text-sm"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                type="button"
              >
                {logoutMutation.isPending ? 'Đang rời đi…' : 'Rời đi'}
              </button>
            </>
          ) : (
            <>
              <Link className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100" href="/login">Đăng nhập</Link>
              <Link className="btn-primary !py-2 !px-5 text-sm" href="/register">Đăng ký</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition-colors"
          type="button"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-[72px] left-0 right-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md px-4 py-6 shadow-lg md:hidden animate-in slide-in-from-top duration-250">
          <div className="flex flex-col gap-5">
            <nav className="flex flex-col gap-4">
              <Link 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0D9E75] transition-all" 
                href={aiHref}
                onClick={() => setIsOpen(false)}
              >
                <Brain size={18} className="text-slate-500" />
                AI Phân Tích
              </Link>
              <Link 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0D9E75] transition-all" 
                href="/doctors"
                onClick={() => setIsOpen(false)}
              >
                <Stethoscope size={18} className="text-slate-500" />
                Danh Bạ Bác Sĩ
              </Link>
              <Link 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0D9E75] transition-all" 
                href="/blog"
                onClick={() => setIsOpen(false)}
              >
                <BookOpen size={18} className="text-slate-500" />
                Blog Y Khoa
              </Link>
            </nav>
            
            <hr className="border-slate-100" />
            
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  {/* User info card */}
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 mb-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D9E75]/10 text-[#0D9E75]">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <Link 
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-all" 
                    href={appHref}
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    Trang quản trị
                  </Link>
                  
                  <button
                    className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 px-4 py-3 text-sm font-bold text-rose-600 transition-all disabled:opacity-60"
                    disabled={logoutMutation.isPending}
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsOpen(false);
                    }}
                    type="button"
                  >
                    <LogOut size={16} />
                    {logoutMutation.isPending ? 'Đang đăng xuất…' : 'Đăng xuất / Rời đi'}
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    className="flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition-all" 
                    href="/login"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link 
                    className="flex items-center justify-center rounded-xl bg-[#0D9E75] hover:bg-[#0B8A65] px-4 py-3 text-sm font-bold text-white shadow-md transition-all" 
                    href="/register"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng ký tài khoản
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
