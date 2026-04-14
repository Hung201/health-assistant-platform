import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { DoctorLayoutClient } from './doctor-layout-client';

export const metadata: Metadata = {
  title: 'Bác sĩ | Clinical Precision',
  description: 'Bảng điều khiển bác sĩ',
};

export default function DoctorGroupLayout({ children }: { children: ReactNode }) {
  return <DoctorLayoutClient>{children}</DoctorLayoutClient>;
}

