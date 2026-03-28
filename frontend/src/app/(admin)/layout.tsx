import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminShell } from './admin-shell';

export const metadata: Metadata = {
  title: 'Quản trị | MediAI',
  description: 'Bảng điều khiển quản trị',
};

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
