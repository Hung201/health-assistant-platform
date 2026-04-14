'use client';

import type { ReactNode } from 'react';

import { RequireRole } from '@/components/auth/RequireRole';
import { DoctorShell } from './doctor-shell';

export function DoctorLayoutClient({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="doctor">
      <DoctorShell>{children}</DoctorShell>
    </RequireRole>
  );
}

