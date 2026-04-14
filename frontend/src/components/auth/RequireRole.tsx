'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/auth.store';

type Props = {
  role?: 'admin' | 'doctor' | 'patient';
  roles?: Array<'admin' | 'doctor' | 'patient'>;
  children: React.ReactNode;
};

export function RequireRole({ role, roles, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // persist middleware hydration flag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const persistApi = (useAuthStore as any).persist;
    if (!persistApi) {
      setHydrated(true);
      return;
    }
    if (persistApi.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsub = persistApi.onFinishHydration?.(() => setHydrated(true));
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const ok = useMemo(() => {
    if (!user) return false;
    if (!role && (!roles || roles.length === 0)) return true;
    if (role) return Boolean(user.roles?.includes(role));
    return roles ? roles.some((r) => user.roles?.includes(r)) : false;
  }, [role, roles, user]);

  useEffect(() => {
    if (!hydrated) return;
    if (ok) return;
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
    router.replace(`/login${next}`);
  }, [hydrated, ok, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light text-slate-600">
        Đang tải…
      </div>
    );
  }

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light text-slate-600">
        Đang chuyển hướng…
      </div>
    );
  }

  return <>{children}</>;
}

