'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function AdminSettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const current = (theme === 'system' ? resolvedTheme : theme) ?? 'light';
  const isDark = current === 'dark';

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cài đặt</h2>
          <p className="text-sm text-muted-foreground">Chưa có API backend cho màn hình này.</p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          ← Dashboard
        </Link>
      </div>

      <div className="max-w-2xl rounded-xl border border-border bg-muted p-6 text-sm text-foreground">
        <div className="mb-5 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Giao diện</p>
            <p className="text-sm font-medium text-foreground">Chuyển nhanh chế độ sáng/tối cho admin.</p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            aria-label="Bật tắt chế độ sáng tối"
            title="Bật tắt chế độ sáng tối"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-amber-500'}`}
            />
            {isDark ? 'Đang bật tối' : 'Đang bật sáng'}
          </button>
        </div>
        <p className="font-semibold">Gợi ý triển khai sau</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-muted-foreground">
          <li>Cấu hình CORS / JWT expiry (biến môi trường)</li>
          <li>Sao lưu DB, log kiểm toán admin</li>
          <li>Thông báo email khi duyệt bác sĩ / bài viết</li>
        </ul>
      </div>
    </>
  );
}
