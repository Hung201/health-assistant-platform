import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Đăng ký | MediSmart AI',
};

export default function RegisterRouteLayout({ children }: { children: ReactNode }) {
  return children;
}
