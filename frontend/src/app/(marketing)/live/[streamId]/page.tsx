'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
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
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-black shadow-lg">
              <div className="min-h-[360px] w-full sm:min-h-[480px]">
                <LiveKitRoom
                  serverUrl={data.serverUrl}
                  token={data.token}
                  connect
                  audio
                  video={false}
                  className="h-[min(75vh,640px)] w-full"
                >
                  <VideoConference />
                </LiveKitRoom>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              Nội dung mang tính thông tin, không thay thế khám trực tiếp tại cơ sở y tế.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
