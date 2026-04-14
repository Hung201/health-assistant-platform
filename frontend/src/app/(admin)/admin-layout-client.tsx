'use client';

import type { ReactNode } from 'react';

import { RequireRole } from '@/components/auth/RequireRole';
import { AdminShell } from './admin-shell';

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="admin">
      <AdminShell>{children}</AdminShell>
    </RequireRole>
  );
}

