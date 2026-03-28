import Link from 'next/link';

export default function RegisterPlaceholderPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-lg font-semibold text-slate-800">Trang đăng ký đang được hoàn thiện.</p>
      <Link className="font-medium text-primary hover:underline" href="/login">
        Quay lại đăng nhập
      </Link>
    </div>
  );
}
