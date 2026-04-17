'use client';

import { useQuery } from '@tanstack/react-query';

import { bookingsApi } from '@/lib/api';

export default function PatientBookingsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patient', 'bookings', 'me'],
    queryFn: bookingsApi.my,
    staleTime: 10_000,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Lịch hẹn của tôi</h2>
        <p className="text-sm text-muted-foreground">Theo dõi lịch hẹn và trạng thái xử lý.</p>
      </header>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-12 border-b border-border bg-muted px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-3">Mã</div>
          <div className="col-span-3">Bác sĩ</div>
          <div className="col-span-3">Chuyên khoa</div>
          <div className="col-span-2">Thời gian</div>
          <div className="col-span-1 text-right">Trạng thái</div>
        </div>

        {isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Đang tải…</div>
        ) : data && data.length > 0 ? (
          <div className="divide-y divide-border">
            {data.map((b) => (
              <div className="grid grid-cols-12 gap-2 px-5 py-4 text-sm" key={b.id}>
                <div className="col-span-3">
                  <p className="font-bold text-foreground">{b.bookingCode}</p>
                  <p className="text-xs text-muted-foreground">
                    Tạo lúc {new Date(b.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-foreground">{b.doctorName}</p>
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-foreground">{b.specialtyName}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold text-foreground">
                    {new Date(b.appointmentStartAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' })}{' '}
                    {new Date(b.appointmentStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    đến {new Date(b.appointmentEndAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="col-span-1 flex items-start justify-end">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                      b.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : b.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : b.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-muted-foreground">Chưa có lịch hẹn nào.</div>
        )}
      </div>
    </div>
  );
}

