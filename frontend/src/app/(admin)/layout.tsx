import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminLayoutClient } from './admin-layout-client';

export const metadata: Metadata = {
  title: 'Quản trị | MediAI',
  description: 'Bảng điều khiển quản trị',
};

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
