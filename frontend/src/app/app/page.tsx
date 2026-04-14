'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/auth.store';

export default function AppLandingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace('/login?next=%2Fapp');
      return;
    }
    if (user.roles?.includes('admin')) {
      router.replace('/admin');
      return;
    }
    if (user.roles?.includes('doctor')) {
      router.replace('/doctor');
      return;
    }
    router.replace('/patient');
  }, [router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light text-slate-600">
      Đang tải…
    </div>
  );
}

