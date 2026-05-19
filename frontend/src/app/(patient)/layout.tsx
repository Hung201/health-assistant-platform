import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { PatientLayoutClient } from './patient-layout-client';
import './patient.css';

export const metadata: Metadata = {
  title: 'Bệnh nhân | Clinical Precision',
  description: 'Bảng điều khiển bệnh nhân',
};

export default function PatientGroupLayout({ children }: { children: ReactNode }) {
  return <PatientLayoutClient>{children}</PatientLayoutClient>;
}

