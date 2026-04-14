'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { authApi, doctorApi } from '@/lib/api';

export default function DoctorSlotsPage() {
  const qc = useQueryClient();
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [maxBookings, setMaxBookings] = useState(5);

  const { data: specialties } = useQuery({
    queryKey: ['public', 'specialties'],
    queryFn: authApi.specialties,
    staleTime: 60_000,
  });

  const { data: slots, isLoading, isError, error } = useQuery({
    queryKey: ['doctor', 'slots'],
    queryFn: doctorApi.mySlots,
    staleTime: 10_000,
  });

  const createSlot = useMutation({
    mutationFn: () => {
      const startAt = new Date(`${date}T${startTime}:00`).toISOString();
      const endAt = new Date(`${date}T${endTime}:00`).toISOString();
      return doctorApi.createSlot({
        startAt,
        endAt,
        maxBookings,
        specialtyId: specialtyId ?? undefined,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['doctor', 'slots'] });
    },
  });

  const cancelSlot = useMutation({
    mutationFn: (id: number) => doctorApi.cancelSlot(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['doctor', 'slots'] });
    },
  });

  const grouped = useMemo(() => {
    const arr = slots ?? [];
    const map = new Map<string, typeof arr>();
    for (const s of arr) {
      const k = s.slotDate;
      const list = map.get(k) ?? [];
      list.push(s);
      map.set(k, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [slots]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lịch trống</h2>
          <p className="text-sm text-slate-500">Tạo slot khám để bệnh nhân đặt lịch.</p>
        </div>
      </header>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Tạo slot</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="date">
              Ngày
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="date"
              onChange={(e) => setDate(e.target.value)}
              type="date"
              value={date}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="start">
              Bắt đầu
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="start"
              onChange={(e) => setStartTime(e.target.value)}
              type="time"
              value={startTime}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="end">
              Kết thúc
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="end"
              onChange={(e) => setEndTime(e.target.value)}
              type="time"
              value={endTime}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="max">
              Số lượt
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="max"
              max={50}
              min={1}
              onChange={(e) => setMaxBookings(Number(e.target.value))}
              type="number"
              value={maxBookings}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="spec">
              Chuyên khoa
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="spec"
              onChange={(e) => setSpecialtyId(e.target.value ? Number(e.target.value) : null)}
              value={specialtyId ?? ''}
            >
              <option value="">(Tuỳ chọn)</option>
              {specialties?.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {createSlot.isError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {(createSlot.error as Error).message}
          </div>
        ) : null}

        <button
          className="mt-4 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={createSlot.isPending}
          onClick={() => createSlot.mutate()}
          type="button"
        >
          {createSlot.isPending ? 'Đang tạo…' : 'Tạo slot'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          Slot của tôi
        </div>
        {isLoading ? (
          <div className="p-5 text-sm text-slate-600">Đang tải…</div>
        ) : grouped.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {grouped.map(([day, rows]) => (
              <div className="p-5" key={day}>
                <p className="mb-3 text-sm font-bold text-slate-900">{day}</p>
                <div className="space-y-2">
                  {rows.map((s) => (
                    <div
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={s.id}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {new Date(s.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(s.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {s.status} • {s.bookedCount}/{s.maxBookings} đã đặt
                        </p>
                      </div>
                      <button
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={cancelSlot.isPending || s.status !== 'available' || s.bookedCount > 0}
                        onClick={() => cancelSlot.mutate(s.id)}
                        type="button"
                      >
                        Huỷ slot
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-slate-600">Chưa có slot nào.</div>
        )}
      </div>
    </div>
  );
}

