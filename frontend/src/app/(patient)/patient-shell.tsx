'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import {
  AlignJustify, Bell, LogOut, User as UserIcon, UserCircle, X,
  LayoutDashboard, Bot, CalendarCheck, CalendarDays, UserCircle2,
  BookOpen, Lock, Settings,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { notificationsApi, type UserNotificationRow } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const NAV = [
  { href: '/patient',              Icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/patient/ai-assistant', Icon: Bot,             label: 'Trạm AI' },
  { href: '/patient/doctors',      Icon: CalendarCheck,   label: 'Đặt lịch' },
  { href: '/patient/bookings',     Icon: CalendarDays,    label: 'Lịch hẹn' },
  { href: '/patient/profile',      Icon: UserCircle2,     label: 'Hồ sơ cá nhân' },
  { href: '/blog',                 Icon: BookOpen,        label: 'Blog' },
  { href: '/patient/security',     Icon: Lock,            label: 'Bảo mật' },
];

function navActive(pathname: string, href: string) {
  if (href === '/patient') return pathname === '/patient';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageTitle(pathname: string) {
  if (pathname === '/patient') return 'Tổng quan';
  if (pathname.startsWith('/patient/ai-assistant')) return 'Trạm AI phân tích triệu chứng';
  if (pathname.startsWith('/patient/doctors')) return 'Đặt lịch khám';
  if (pathname.startsWith('/patient/bookings')) return 'Lịch hẹn của tôi';
  if (pathname.startsWith('/patient/profile')) return 'Hồ sơ cá nhân';
  if (pathname.startsWith('/blog')) return 'Blog sức khỏe';
  if (pathname.startsWith('/patient/security')) return 'Bảo mật tài khoản';
  return 'Dashboard';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'Vừa xong';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleString('vi-VN');
}

function priorityClass(p: UserNotificationRow['priority']): string {
  if (p === 'high') return 'bg-red-100 text-red-700';
  if (p === 'low') return 'bg-slate-100 text-slate-600';
  return 'bg-amber-100 text-amber-700';
}

export function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState<'all' | 'unread'>('unread');
  const noticeRef = useRef<HTMLDivElement | null>(null);

  const pageTitle = getPageTitle(pathname);

  const { data: noticeRes } = useQuery({
    queryKey: ['patient', 'notifications', noticeFilter],
    queryFn: () => notificationsApi.my(noticeFilter, 20, 0),
    staleTime: 15_000,
    enabled: Boolean(user?.id),
  });
  const notifications = noticeRes?.items ?? [];
  const unreadCount = noticeRes?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['patient', 'notifications'] }); },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['patient', 'notifications'] }); },
  });

  useEffect(() => { setMobileNavOpen(false); setNoticeOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNavOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!noticeOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!noticeRef.current) return;
      if (!noticeRef.current.contains(e.target as Node)) setNoticeOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [noticeOpen]);

  useEffect(() => {
    if (!user?.id) return;
    const es = new EventSource(notificationsApi.streamUrl(), { withCredentials: true });
    const onMessage = () => { void qc.invalidateQueries({ queryKey: ['patient', 'notifications'] }); };
    es.addEventListener('notifications', onMessage);
    es.onerror = () => {};
    return () => { es.removeEventListener('notifications', onMessage); es.close(); };
  }, [qc, user?.id]);

  const closeMobileNav = () => setMobileNavOpen(false);

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : 'U';

  return (
    <div className="flex min-h-screen bg-[#F7FAFB] text-slate-900 font-sans">
      {/* Mobile overlay */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={closeMobileNav}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          'fixed z-30 flex h-full w-[260px] flex-col border-r border-[#E8EDF2] shadow-sm transition-transform duration-200 ease-out',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ background: 'linear-gradient(175deg, #ffffff 0%, #f4fbf8 100%)' }}
        id="patient-sidebar-nav"
      >
        {/* Logo area */}
        <div className="flex h-[72px] shrink-0 items-center gap-[10px] px-5 border-b border-[#E8EDF2]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#0D9E75] text-white shadow-sm">
            <span className="material-symbols-outlined text-[20px]">medical_services</span>
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href="/"
              onClick={closeMobileNav}
              className="block text-[16px] font-bold leading-tight text-[#1a3353] truncate"
            >
              Clinical Precision
            </Link>
            <p className="text-[10px] font-medium tracking-widest text-[#0D9E75] uppercase mt-0.5">
              AI DIAGNOSTIC HUB
            </p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            onClick={closeMobileNav}
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav section */}
        <nav className="flex-1 overflow-y-auto py-3">
          <p className="px-5 pt-4 pb-1.5 text-[10px] font-semibold tracking-[.08em] uppercase text-[#94A3B8]">
            MENU CHÍNH
          </p>
          {NAV.map((item) => {
            const active = navActive(pathname, item.href);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
                className={cn(
                  'mx-2 my-0.5 flex h-11 items-center gap-[10px] rounded-[10px] px-3 text-[14px] font-medium transition-all duration-150',
                  active
                    ? 'nav-item-active text-white shadow-[0_4px_14px_rgba(13,158,117,0.32)]'
                    : 'text-[#475569] hover:bg-[#E8F8F2]/60 hover:text-[#0D9E75]',
                )}
                style={active ? { background: 'linear-gradient(135deg, #0D9E75, #0B8A65)' } : {}}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-[#94A3B8] group-hover:text-[#0D9E75]'} />
                <span className="flex-1">{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user card */}
        <div className="shrink-0 border-t border-[#E8EDF2] p-4 bg-white/60">
          {/* Teal top accent */}
          <div className="mb-3 h-[2px] w-8 rounded-full bg-gradient-to-r from-[#0D9E75] to-[#1BAF7C]" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#0D9E75]/10 flex items-center justify-center text-[#0D9E75] text-sm font-bold">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.fullName ?? ''} className="h-full w-full object-cover" />
                : userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#1a3353] truncate">{user?.fullName ?? 'Bệnh nhân'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email ?? ''}</p>
            </div>
            <button
              type="button"
              aria-label="Cài đặt"
              onClick={() => router.push('/patient/profile')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#0D9E75] transition-colors"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="ml-0 flex min-h-screen flex-1 flex-col lg:ml-[260px]">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-3 border-b border-[#E8EDF2]/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 hover:bg-[#E8F8F2] hover:text-[#0D9E75] hover:ring-[#0D9E75]/30 transition-all lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Mở menu"
            >
              <AlignJustify size={20} />
            </button>
            {/* Breadcrumb accent line + title */}
            <div className="flex min-w-0 items-center gap-0">
              <span className="breadcrumb-accent hidden sm:inline-block" aria-hidden />
              <h1 className="text-[18px] sm:text-[20px] font-bold text-[#1a3353] truncate">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Notification bell */}
            <div className="relative" ref={noticeRef}>
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9E75] focus-visible:ring-offset-2"
                onClick={() => setNoticeOpen((v) => !v)}
                aria-expanded={noticeOpen}
                aria-label="Thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-[9px] w-[9px] items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {noticeOpen && (
                <div className="absolute right-0 top-12 z-40 w-[min(92vw,23rem)] overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Thông báo</p>
                      <p className="text-xs text-slate-400">{unreadCount} chưa đọc</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#0D9E75] hover:underline disabled:text-slate-400"
                      onClick={() => { if (!markAllMutation.isPending && notifications.length > 0) markAllMutation.mutate(); }}
                      disabled={notifications.length === 0 || markAllMutation.isPending}
                    >
                      {markAllMutation.isPending ? 'Đang xử lý…' : 'Đánh dấu đã đọc'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                    {(['unread', 'all'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setNoticeFilter(f)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                          noticeFilter === f ? 'bg-[#0D9E75] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        )}
                      >
                        {f === 'unread' ? 'Chưa đọc' : 'Tất cả'}
                      </button>
                    ))}
                  </div>
                  <div className="max-h-[22rem] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">Chưa có thông báo mới.</div>
                    ) : (
                      notifications.map((n) => {
                        const unread = !n.isRead;
                        return (
                          <Link
                            key={n.id}
                            href={n.link || '/patient/bookings'}
                            className={cn(
                              'block border-b border-slate-100 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50',
                              unread ? 'bg-[#0D9E75]/5' : '',
                            )}
                            onClick={() => { if (!n.isRead) markReadMutation.mutate(n.id); setNoticeOpen(false); }}
                          >
                            <div className="flex items-start gap-2">
                              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', unread ? 'bg-[#0D9E75]' : 'bg-slate-300')} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold shrink-0', priorityClass(n.priority))}>{n.priority}</span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-slate-500">{n.message}</p>
                                <p className="mt-1 text-[11px] text-slate-400">{relativeTime(n.createdAt)}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                  <div className="border-t border-slate-100 px-4 py-2">
                    <Link href="/patient/bookings" className="text-xs font-semibold text-[#0D9E75] hover:underline" onClick={() => setNoticeOpen(false)}>
                      Xem tất cả tại Lịch hẹn →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar menu */}
            <Menu.Root modal={false}>
              <Menu.Trigger
                type="button"
                delay={120}
                closeDelay={180}
                openOnHover
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#0D9E75]/30 bg-slate-100 text-slate-600 outline-none transition-all hover:ring-[#0D9E75]/60 focus-visible:ring-[#0D9E75]"
              >
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.fullName ?? ''} className="h-full w-full object-cover" />
                  : <UserIcon size={20} />}
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-[100]">
                  <Menu.Popup className="min-w-[220px] origin-[var(--transform-origin)] rounded-xl border border-[#E8EDF2] bg-white py-1.5 text-slate-800 shadow-lg outline-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
                    <div className="border-b border-slate-100 px-3 pb-2 pt-1">
                      <p className="truncate text-sm font-bold text-[#1a3353]">{user?.fullName ?? 'Bệnh nhân'}</p>
                      <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
                    </div>
                    <Menu.Item
                      className="mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none data-[highlighted]:bg-[#0D9E75]/10 data-[highlighted]:text-[#0D9E75]"
                      onClick={() => router.push('/patient/profile')}
                    >
                      <UserCircle size={16} className="text-slate-400" />
                      Hồ sơ cá nhân
                    </Menu.Item>
                    <Menu.Separator className="my-1 h-px bg-slate-100" />
                    <Menu.Item
                      className="mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 outline-none data-[highlighted]:bg-red-50"
                      onClick={() => { logout(); router.replace('/login'); }}
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        </header>

        {/* Page Content */}
        <main key={pathname} className="flex-1 p-4 sm:p-6 lg:p-8 page-enter">{children}</main>
      </div>
    </div>
  );
}
