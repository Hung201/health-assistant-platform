'use client';

import type { ReactNode } from 'react';

import { RequireRole } from '@/components/auth/RequireRole';
import { PatientShell } from './patient-shell';

export function PatientLayoutClient({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="patient">
      <PatientShell>{children}</PatientShell>
    </RequireRole>
  );
}

