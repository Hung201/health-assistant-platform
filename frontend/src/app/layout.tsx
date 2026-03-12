import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Health Assistant Platform',
  description: 'Đặt lịch khám bác sĩ - MVP',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
