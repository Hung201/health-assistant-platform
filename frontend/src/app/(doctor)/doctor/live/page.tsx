'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import '@livekit/components-styles';

import { doctorLivestreamsApi, type LiveStreamRow } from '@/lib/api';

import { DoctorLiveStudio } from './doctor-live-studio';

function statusBadgeClass(status: string) {
  if (status === 'live') return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100';
  if (status === 'scheduled') return 'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100';
  if (status === 'ended') return 'border-border bg-muted text-muted-foreground';
  return 'border-border bg-muted/80 text-foreground';
}

export default function DoctorLivePage() {
  const [draft, setDraft] = useState<LiveStreamRow | null>(null);
  const [liveKit, setLiveKit] = useState<{ url: string; token: string; streamId: string } | null>(null);
  const [title, setTitle] = useState('');

  const { data: mine, refetch: refetchMine } = useQuery({
    queryKey: ['doctor', 'livestreams', 'mine'],
    queryFn: () => doctorLivestreamsApi.mine(1, 10),
  });

  const createMutation = useMutation({
    mutationFn: () => doctorLivestreamsApi.create({ title: title.trim() || 'Buổi trực tiếp' }),
    onSuccess: (row) => {
      setDraft(row);
      setLiveKit(null);
    },
  });

  const goLiveMutation = useMutation({
    mutationFn: (id: string) => doctorLivestreamsApi.goLive(id),
    onSuccess: (res) => {
      setDraft(res.stream);
      setLiveKit({ url: res.serverUrl, token: res.token, streamId: res.stream.id });
    },
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => doctorLivestreamsApi.end(id),
    onSuccess: (_row, endedId) => {
      setLiveKit((lk) => (lk?.streamId === endedId ? null : lk));
      setDraft((d) => (d?.id === endedId ? null : d));
      void refetchMine();
    },
  });

  const activeId = liveKit?.streamId ?? draft?.id;
  const streamTitle = (draft?.title?.trim() || title.trim() || 'Buổi trực tiếp').trim();

  const liveSessionElsewhere = useMemo(
    () => mine?.items.find((s) => s.status === 'live') ?? null,
    [mine],
  );

  const step = useMemo(() => {
    if (liveKit) return 3 as const;
    if (draft?.status === 'scheduled') return 2 as const;
    if (draft) return 2 as const;
    if (liveSessionElsewhere) return 3 as const;
    return 1 as const;
  }, [draft, liveKit, liveSessionElsewhere]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Phát trực tiếp</h2>
          <p className="text-sm text-muted-foreground">
            Tạo phiên, chia sẻ liên kết cho bệnh nhân, phát qua LiveKit. Trên server cần cấu hình{' '}
            <code className="rounded bg-muted px-1 text-xs">LIVEKIT_URL</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">LIVEKIT_API_KEY</code>,{' '}
            <code className="rounded bg-muted px-1 text-xs">LIVEKIT_API_SECRET</code> — xem{' '}
            <code className="rounded bg-muted px-1 text-xs">backend/.env.example</code>.
          </p>
        </div>
        <Link className="shrink-0 text-sm font-medium text-primary hover:underline" href="/doctor">
          ← Tổng quan
        </Link>
      </div>

      <ol className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        {[
          { n: 1, label: 'Tạo phiên', active: step >= 1, done: step > 1 },
          { n: 2, label: 'Bắt đầu phát', active: step >= 2, done: step > 2 },
          { n: 3, label: 'Trong phòng live', active: step >= 3, done: false },
        ].map((s, i) => (
          <li key={s.n} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                s.done
                  ? 'border-primary bg-primary text-primary-foreground'
                  : s.active
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground'
              }`}
            >
              {s.done ? '✓' : s.n}
            </span>
            <span className={s.active ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{s.label}</span>
            {i < 2 ? <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">→</span> : null}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tiêu đề buổi live</p>
        <input
          className="mb-4 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: Tư vấn tim mạch tuần 12"
          disabled={Boolean(liveKit) || Boolean(draft)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            disabled={createMutation.isPending || Boolean(liveKit) || Boolean(draft)}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Đang tạo…' : 'Tạo phiên'}
          </button>
          {draft && draft.status === 'scheduled' ? (
            <button
              type="button"
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50"
              disabled={goLiveMutation.isPending || Boolean(liveKit)}
              onClick={() => goLiveMutation.mutate(draft.id)}
            >
              {goLiveMutation.isPending ? 'Đang kết nối…' : 'Bắt đầu phát'}
            </button>
          ) : null}
          {activeId && liveKit ? (
            <button
              type="button"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive disabled:opacity-50"
              disabled={endMutation.isPending}
              onClick={() => endMutation.mutate(activeId)}
            >
              {endMutation.isPending && endMutation.variables === activeId ? 'Đang kết thúc…' : 'Kết thúc phát'}
            </button>
          ) : null}
        </div>
        {createMutation.error ? (
          <p className="mt-3 text-sm text-destructive">{(createMutation.error as Error).message}</p>
        ) : null}
        {goLiveMutation.error ? (
          <p className="mt-3 text-sm text-destructive">{(goLiveMutation.error as Error).message}</p>
        ) : null}
        {endMutation.error ? (
          <p className="mt-3 text-sm text-destructive">{(endMutation.error as Error).message}</p>
        ) : null}
        {draft ? (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Phiên:</span>{' '}
            <span className="font-mono text-foreground/90">{draft.id}</span>
            <span className="mx-2 text-border">|</span>
            <span className="font-semibold text-foreground">Trạng thái:</span>{' '}
            <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(draft.status)}`}>
              {draft.status}
            </span>
          </div>
        ) : null}
      </div>

      {liveSessionElsewhere && !liveKit ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">Đang có phiên live trên hệ thống</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
            Phiên &quot;{liveSessionElsewhere.title}&quot; vẫn ở trạng thái live (ví dụ sau khi tải lại trang hoặc đóng tab). Bấm kết thúc để đóng phiên cho bệnh nhân; hoặc bấm &quot;Bắt đầu phát&quot; lại nếu bạn vừa tạo phiên mới và muốn vào phòng.
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg border border-destructive/50 bg-destructive/15 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-50"
            disabled={endMutation.isPending}
            onClick={() => endMutation.mutate(liveSessionElsewhere.id)}
          >
            {endMutation.isPending && endMutation.variables === liveSessionElsewhere.id
              ? 'Đang kết thúc…'
              : 'Kết thúc phiên live này'}
          </button>
        </div>
      ) : null}

      {liveKit ? (
        <DoctorLiveStudio
          serverUrl={liveKit.url}
          token={liveKit.token}
          streamId={liveKit.streamId}
          streamTitle={streamTitle}
          onDisconnected={() => {
            setLiveKit(null);
            void refetchMine();
          }}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">Chưa vào phòng live</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sau khi bấm &quot;Bắt đầu phát&quot;, khung video, điều khiển mic/camera và liên kết cho bệnh nhân sẽ hiển thị tại đây. Khi đang phát, nút &quot;Kết thúc phát&quot; nằm phía trên; nếu mất trang, dùng ô cảnh báo màu vàng hoặc nút trong &quot;Phiên gần đây&quot; để kết thúc.
          </p>
        </div>
      )}

      {mine && mine.items.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-foreground">Phiên gần đây</h3>
          <ul className="divide-y divide-border/80 text-sm">
            {mine.items.map((s) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0" key={s.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{s.title}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{s.id}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(s.status)}`}
                  >
                    {s.status}
                  </span>
                  {s.status === 'live' ? (
                    <button
                      type="button"
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive disabled:opacity-50"
                      disabled={endMutation.isPending}
                      onClick={() => endMutation.mutate(s.id)}
                    >
                      {endMutation.isPending && endMutation.variables === s.id ? 'Đang kết thúc…' : 'Kết thúc'}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
