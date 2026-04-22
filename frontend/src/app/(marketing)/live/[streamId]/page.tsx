'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LiveKitRoom, StartAudio, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

import { livestreamsApi } from '@/lib/api';

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
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-teal-700 hover:underline">
            ← Về trang chủ
          </Link>
        </div>

        {isLoading ? <p className="text-center text-slate-600">Đang tải…</p> : null}

        {isError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
            <p className="font-semibold">Không thể xem phát trực tiếp</p>
            <p className="mt-2 text-sm">{(error as Error).message}</p>
          </div>
        ) : null}

        {data ? (
          <>
            <div className="mb-4">
              <h1 className="text-xl font-bold text-slate-900">{data.title}</h1>
              <p className="text-sm text-slate-600">Bác sĩ: {data.doctorName}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-lg">
              <LiveKitRoom
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
                <div className="relative flex min-h-0 w-full flex-1 flex-col">
                  <VideoConference className="h-full min-h-0 w-full flex-1" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-3 [&>button]:pointer-events-auto">
                    <StartAudio label="Bật âm thanh (nếu trình duyệt chặn tự phát)" />
                  </div>
                </div>
              </LiveKitRoom>
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
