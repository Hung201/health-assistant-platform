'use client';

import { useAuthStore } from '@/stores/auth.store';

export default function DoctorProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Hồ sơ hành nghề</h2>
        <p className="text-sm text-slate-500">(Sắp làm) Cập nhật chuyên khoa, số CCHN, nơi công tác…</p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Họ tên</p>
            <p className="mt-1 font-semibold text-slate-900">{user?.fullName ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-1 font-semibold text-slate-900">{user?.email ?? '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

