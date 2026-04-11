import Link from 'next/link';

export default function AdminSettingsPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cài đặt</h2>
          <p className="text-sm text-slate-500">Chưa có API backend cho màn hình này.</p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          ← Dashboard
        </Link>
      </div>

      <div className="max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Gợi ý triển khai sau</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-amber-800">
          <li>Cấu hình CORS / JWT expiry (biến môi trường)</li>
          <li>Sao lưu DB, log kiểm toán admin</li>
          <li>Thông báo email khi duyệt bác sĩ / bài viết</li>
        </ul>
      </div>
    </>
  );
}
