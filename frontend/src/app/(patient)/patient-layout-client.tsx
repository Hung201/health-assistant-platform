'use client';

import type { ReactNode } from 'react';

import { RequireRole } from '@/components/auth/RequireRole';
import { LightOnly } from '@/components/theme/light-only';
import { PatientShell } from './patient-shell';

export function PatientLayoutClient({ children }: { children: ReactNode }) {
  return (
    <LightOnly>
      <RequireRole role="patient">
        <PatientShell>{children}</PatientShell>
      </RequireRole>
    </LightOnly>
  );
}

