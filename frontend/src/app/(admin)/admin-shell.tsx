'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlignJustify, X, Home, LayoutDashboard, Users, Stethoscope,
  FileText, MessageSquare, Tag, BookOpen, Settings, LogOut, ChevronRight,
} from 'lucide-react';

import { adminApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const ADMIN_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDUMP08rYqsRC6ewEBgMsxpA7wgUXnnD0_tJeg2dhExPM2ln1Ca3iMmxnPBUW0UmmB3DEYtdNbJB1xAim7gPzNrVJU53gmTfuzIBL3S7OOTR42zSB5a1iGavXy8d-cQAVKTTb_uPOC5OTogepdSKi45wCd3XyTYt09oA2yneo4gz5dtjmRBrEbPorEN6XXxH-RbO5clcwFIn_ntipfYZgFS5BOFmjCt8mgzaOg6IYm-z1xnAhgNTWClY6c52k0uZZOqQhbD2IMGrgBu';

type NavItem = {
  href: string;
  Icon: React.ElementType;
  label: string;
  badgeFrom?: 'pendingPosts' | 'pendingDoctors';
};

const NAV: NavItem[] = [
  { href: '/',                          Icon: Home,          label: 'Về trang chủ' },
  { href: '/admin',                     Icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users',               Icon: Users,         label: 'Người dùng' },
  { href: '/admin/doctors/pending',     Icon: Stethoscope,   label: 'Duyệt bác sĩ',    badgeFrom: 'pendingDoctors' },
  { href: '/admin/posts/pending',       Icon: FileText,      label: 'Duyệt bài viết',  badgeFrom: 'pendingPosts' },
  { href: '/admin/questions/pending',   Icon: MessageSquare, label: 'Duyệt hỏi đáp' },
  { href: '/admin/specialties',         Icon: Tag,           label: 'Chuyên khoa' },
  { href: '/blog',                      Icon: BookOpen,      label: 'Kiến thức y khoa' },
  { href: '/admin/settings',            Icon: Settings,      label: 'Cài đặt' },
];

// Bottom tabs for mobile (most important)
const MOBILE_TABS: NavItem[] = [
  { href: '/admin',                   Icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users',             Icon: Users,          label: 'Người dùng' },
  { href: '/admin/doctors/pending',   Icon: Stethoscope,    label: 'Bác sĩ', badgeFrom: 'pendingDoctors' },
  { href: '/admin/posts/pending',     Icon: FileText,       label: 'Bài viết', badgeFrom: 'pendingPosts' },
];

function navActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageTitle(pathname: string) {
  if (pathname === '/admin') return 'Dashboard';
  if (pathname.startsWith('/admin/users')) return 'Người dùng';
  if (pathname.startsWith('/admin/doctors/pending')) return 'Duyệt bác sĩ';
  if (pathname.startsWith('/admin/posts/pending')) return 'Duyệt bài viết';
  if (pathname.startsWith('/admin/questions/pending')) return 'Duyệt hỏi đáp';
  if (pathname.startsWith('/admin/specialties')) return 'Chuyên khoa';
  if (pathname.startsWith('/admin/settings')) return 'Cài đặt';
  if (pathname.startsWith('/blog')) return 'Kiến thức y khoa';
  return 'Quản trị';
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const pageTitle = getPageTitle(pathname);

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : 'AD';

  useEffect(() => { setMobileOpen(false); setMoreSheetOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!moreSheetOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreSheetOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [moreSheetOpen]);

  const { data: summary } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: () => adminApi.dashboardSummary(30),
    staleTime: 30_000,
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.replace('/login');
    },
  });

  const getBadge = (badgeFrom?: NavItem['badgeFrom']) => {
    if (!badgeFrom || !summary) return null;
    const count = badgeFrom === 'pendingPosts' ? summary.pendingPosts : summary.pendingDoctors;
    if (!count || count <= 0) return null;
    return count > 99 ? '99+' : String(count);
  };

  const renderSidebar = () => (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-[hsl(222_20%_14%)] border-r border-[#E8EDF2] dark:border-white/10">
      {/* Logo */}
      <div className="flex h-[72px] shrink-0 items-center gap-3 px-5 border-b border-[#E8EDF2] dark:border-white/10">
        <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center">
          <img src="/images/logo-full.png" alt="MedAI Logo" className="h-9 w-auto object-contain" />
        </Link>
        <div className="min-w-0 flex-1 flex flex-col justify-end h-full py-3">
          <p className="text-[10px] font-medium tracking-widest text-primary uppercase mt-0.5">ADMIN</p>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Đóng menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: 'none' }}>
        <p className="px-5 pt-4 pb-1.5 text-[10px] font-semibold tracking-[.08em] uppercase text-muted-foreground">
          MENU CHÍNH
        </p>
        {NAV.map((item) => {
          const active = navActive(pathname, item.href);
          const badge = getBadge(item.badgeFrom);
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={[
                'mx-2 my-0.5 flex h-11 items-center gap-[10px] rounded-[10px] px-3 text-[14px] font-medium transition-all duration-150',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/70 hover:bg-primary/8 hover:text-primary',
              ].join(' ')}
            >
              <Icon size={18} className={active ? 'text-primary-foreground' : 'text-muted-foreground'} />
              <span className="flex-1">{item.label}</span>
              {badge && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-destructive/15 text-destructive'
                }`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user card */}
      <div className="shrink-0 border-t border-[#E8EDF2] dark:border-white/10 p-4">
        <div className="mb-3 h-[2px] w-8 rounded-full bg-gradient-to-r from-primary to-primary/60" />
        <div className="flex items-center gap-3">
          <img
            alt="Admin"
            className="h-9 w-9 shrink-0 rounded-full border border-[#E8EDF2] object-cover"
            src={user?.avatarUrl || ADMIN_AVATAR}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-foreground truncate">{user?.fullName ?? 'Admin'}</p>
            <p className="text-[11px] text-muted-foreground">Quản trị viên</p>
          </div>
        </div>
        <button
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          type="button"
        >
          <LogOut size={16} />
          {logoutMutation.isPending ? 'Đang rời đi…' : 'Rời đi'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng"
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed z-30 flex h-full flex-col transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        id="admin-sidebar-nav"
      >
        {renderSidebar()}
      </aside>

      {/* Main */}
      <div className="ml-0 flex min-h-screen flex-1 flex-col md:ml-64">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Mobile Logo */}
            <Link href="/" className="flex items-center gap-2.5 md:hidden">
              <img src="/images/logo-full.png" alt="MedAI Logo" className="h-8 w-auto object-contain" />
            </Link>

            {/* Desktop Title */}
            <h1 className="hidden md:block text-[20px] font-bold text-foreground truncate">{pageTitle}</h1>
          </div>

          {/* Right side: user info */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden sm:block text-xs font-semibold text-muted-foreground bg-primary/8 text-primary px-3 py-1 rounded-full">
              Admin
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/30 bg-primary/10 text-primary text-sm font-bold hover:ring-primary/60 transition-all"
              onClick={() => setMoreSheetOpen(true)}
              aria-label="Tài khoản"
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.fullName ?? ''} className="h-full w-full object-cover" />
                : userInitials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main key={pathname} className="flex-1 p-4 pb-[5.5rem] sm:p-6 sm:pb-[5.5rem] md:p-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around border-t border-[#E8EDF2] bg-white/97 backdrop-blur-[20px]"
        style={{
          height: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -6px 28px rgba(0,0,0,0.07)',
        }}
        aria-label="Điều hướng admin"
      >
        {MOBILE_TABS.map(({ href, Icon, label, badgeFrom }) => {
          const active = navActive(pathname, href);
          const badge = getBadge(badgeFrom);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-[3px] px-1 py-2 text-[10px] font-semibold transition-colors ${
                active ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                {badge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </div>
              <span>{label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-7 rounded-b-full bg-primary" />
              )}
            </Link>
          );
        })}
        {/* More tab */}
        <button
          type="button"
          className={`relative flex flex-1 flex-col items-center justify-center gap-[3px] px-1 py-2 text-[10px] font-semibold transition-colors border-none bg-transparent ${
            moreSheetOpen ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
          onClick={() => setMoreSheetOpen(true)}
          aria-label="Thêm"
        >
          <AlignJustify size={21} strokeWidth={1.8} />
          <span>Thêm</span>
        </button>
      </nav>

      {/* ── MORE SHEET (admin, mobile) ── */}
      {moreSheetOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng"
            className="md:hidden fixed inset-0 z-[50] bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => setMoreSheetOpen(false)}
          />
          <div className="md:hidden fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl bg-white shadow-2xl" style={{ animation: 'sheetSlideUp 0.35s cubic-bezier(0.32,0.72,0,1) both' }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            {/* User card */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
              <img alt="Admin" className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover" src={user?.avatarUrl || ADMIN_AVATAR} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-slate-900 truncate">{user?.fullName ?? 'Admin'}</p>
                <p className="text-[11px] text-slate-400">Quản trị viên</p>
              </div>
            </div>
            {/* Extra nav links */}
            <div className="p-3 space-y-0.5">
              {[
                { href: '/', Icon: Home, label: 'Về trang chủ' },
                { href: '/admin/questions/pending', Icon: MessageSquare, label: 'Duyệt hỏi đáp' },
                { href: '/admin/specialties', Icon: Tag, label: 'Chuyên khoa' },
                { href: '/blog', Icon: BookOpen, label: 'Kiến thức y khoa' },
                { href: '/admin/settings', Icon: Settings, label: 'Cài đặt' },
              ].map(({ href, Icon, label }) => {
                const active = navActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreSheetOpen(false)}
                    className={[
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      active ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <Icon size={18} className={active ? 'text-primary' : 'text-slate-400'} />
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1 disabled:opacity-50"
              >
                <LogOut size={18} />
                {logoutMutation.isPending ? 'Đang rời đi…' : 'Rời đi'}
              </button>
            </div>
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        </>
      )}
    </div>
  );
}
