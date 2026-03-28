import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Đăng nhập | MediSmart AI',
  description: 'Đăng nhập để quản lý sức khỏe và lịch hẹn',
};

export default function LoginRouteLayout({ children }: { children: ReactNode }) {
  return children;
}
