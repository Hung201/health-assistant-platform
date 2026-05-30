'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

import { LiveCommentPanel } from '@/components/live/live-comment-panel';
import { LiveViewerStage } from '@/components/live/live-viewer-stage';
import { livestreamsApi } from '@/lib/api';

/** Animated loading skeleton for the waiting state */
function WaitingScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-16 text-center shadow-sm">
      {/* Pulse avatar placeholder */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400/20" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-2xl font-bold text-white shadow-lg">
          🩺
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-base font-semibold text-slate-800">Đang tải buổi phát trực tiếp…</p>
        <p className="text-sm text-slate-500">Vui lòng chờ trong giây lát.</p>
      </div>
      {/* Animated bar skeleton */}
      <div className="w-48 space-y-2">
        <div className="h-2 animate-pulse rounded-full bg-slate-200" />
        <div className="mx-auto h-2 w-3/4 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

/** Error/offline state */
function OfflineScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-12 text-center shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">📺</span>
      <div>
        <p className="font-semibold text-amber-900">Không thể xem phát trực tiếp</p>
        <p className="mt-1 text-sm text-amber-700">{message}</p>
      </div>
      <Link
        href="/"
        className="mt-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50"
      >
        ← Về trang chủ
      </Link>
    </div>
  );
}

/** Booking CTA button */
function BookingCTA({ doctorName }: { doctorName: string }) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-5 py-4 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-teal-900">Muốn khám trực tiếp với {doctorName}?</p>
        <p className="mt-0.5 text-xs text-teal-700">Đặt lịch ngay để được tư vấn chuyên sâu hơn.</p>
      </div>
      <Link
        href="/patient/doctors"
        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700 active:bg-teal-800"
      >
        Đặt lịch khám →
      </Link>
    </div>
  );
}

export default function PublicLiveViewerPage() {
  const params = useParams();
  const streamId = typeof params.streamId === 'string' ? params.streamId : '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['livestreams', 'join', streamId],
    queryFn: () => livestreamsApi.join(streamId),
    enabled: Boolean(streamId),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-[#fafafb] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        {/* Header nav */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-teal-700 transition-colors hover:underline">
            ← Về trang chủ
          </Link>
        </div>

        {/* Loading state */}
        {isLoading ? <WaitingScreen /> : null}

        {/* Error state */}
        {isError ? <OfflineScreen message={(error as Error).message} /> : null}

        {/* Stream loaded */}
        {data ? (
          <>
            {/* Stream header */}
            <div className="mb-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  LIVE
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{data.title}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <p className="text-sm text-slate-600">Bác sĩ: {data.doctorName}</p>
                {/* Doctor credentials badge */}
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                  🩺 Bác sĩ chuyên khoa
                </span>
              </div>
            </div>

            {/* Main content grid — stacks on mobile */}
            <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-stretch">
              {/* Video panel */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-lg">
                <LiveKitRoom
                  key={data.token}
                  serverUrl={data.serverUrl}
                  token={data.token}
                  connect
                  audio={false}
                  video={false}
                  className="flex h-[min(78vh,680px)] min-h-[440px] w-full flex-col bg-black"
                  onError={(e) => {
                    console.error('[live viewer]', e);
                  }}
                >
                  <LiveViewerStage />
                </LiveKitRoom>
              </div>

              {/* Comment panel — on mobile, add pb so keyboard doesn't cover input */}
              <div className="flex flex-col pb-[env(keyboard-inset-height,0px)]">
                <LiveCommentPanel streamId={streamId} />
              </div>
            </div>

            {/* Booking CTA — sticky below video, above footnote */}
            <div className="mt-4">
              <BookingCTA doctorName={data.doctorName} />
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Nếu vẫn đen: thử tải lại trang, đợi bác sĩ đã bật camera, hoặc bấm «Bật âm thanh». Nội dung mang tính thông tin,
              không thay thế khám trực tiếp tại cơ sở y tế.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
