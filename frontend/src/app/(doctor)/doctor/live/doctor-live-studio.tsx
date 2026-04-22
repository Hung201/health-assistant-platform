'use client';

import { useEffect, useRef, useState } from 'react';
import { ConnectionState } from 'livekit-client';
import {
  LiveKitRoom,
  VideoConference,
  useConnectionState,
  useParticipants,
} from '@livekit/components-react';

import { useToast } from '@/components/ui/toast';

type DoctorLiveStudioProps = {
  serverUrl: string;
  token: string;
  streamId: string;
  streamTitle: string;
  onDisconnected: () => void;
};

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function connectionLabel(state: ConnectionState): string {
  switch (state) {
    case ConnectionState.Connecting:
      return 'Đang kết nối…';
    case ConnectionState.Connected:
      return 'Đã kết nối';
    case ConnectionState.Reconnecting:
    case ConnectionState.SignalReconnecting:
      return 'Đang kết nối lại…';
    case ConnectionState.Disconnected:
      return 'Ngắt kết nối';
    default:
      return state;
  }
}

function connectionBadgeClass(state: ConnectionState): string {
  if (state === ConnectionState.Connected) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-100';
  }
  if (
    state === ConnectionState.Reconnecting ||
    state === ConnectionState.SignalReconnecting ||
    state === ConnectionState.Connecting
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100';
  }
  return 'border-border bg-muted text-muted-foreground';
}

function usePublicLiveUrl(streamId: string) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    setUrl(`${window.location.origin}/live/${streamId}`);
  }, [streamId]);
  return url;
}

function LiveShareSidebar({ streamId, streamTitle }: { streamId: string; streamTitle: string }) {
  const { show } = useToast();
  const publicUrl = usePublicLiveUrl(streamId);

  const copy = () => {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(publicUrl).then(
      () => show({ message: 'Đã sao chép liên kết cho bệnh nhân.', variant: 'success' }),
      () => show({ message: 'Không thể sao chép tự động. Hãy chọn và copy tay.', variant: 'error' }),
    );
  };

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 xl:w-[300px]">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Liên kết xem (bệnh nhân)</p>
        <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground" title={streamTitle}>
          {streamTitle}
        </p>
        <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{publicUrl || '…'}</p>
        <button
          type="button"
          onClick={copy}
          disabled={!publicUrl}
          className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Sao chép liên kết
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Gửi liên kết này cho bệnh nhân; họ mở trên trình duyệt, không cần đăng nhập bác sĩ.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Điều khiển nhanh</p>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs text-muted-foreground">
          <li>Thanh công cụ dưới khung video: tắt/bật mic và camera.</li>
          <li>Chia sẻ màn hình khi cần trình chiếu tài liệu.</li>
          <li>Biểu tượng chat: trao đổi ngắn với người xem trong phòng.</li>
          <li>Âm thanh trình duyệt: nếu không nghe được, bấm &quot;Bật âm thanh&quot; khi trình duyệt hỏi.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <span className="font-mono text-[10px] text-foreground/80">{streamId}</span>
        <p className="mt-2">Mã phiên trên hệ thống (hỗ trợ khi cần kiểm tra log).</p>
      </div>
    </aside>
  );
}

function LiveSessionMain({ streamTitle }: { streamTitle: string }) {
  const conn = useConnectionState();
  const participants = useParticipants();
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (conn === ConnectionState.Connected) {
      if (startedAtRef.current == null) startedAtRef.current = Date.now();
      const tick = () => {
        if (startedAtRef.current != null) setElapsedMs(Date.now() - startedAtRef.current);
      };
      tick();
      tickRef.current = setInterval(tick, 1000);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
      };
    }
    startedAtRef.current = null;
    setElapsedMs(0);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, [conn]);

  const inRoom = participants.length;
  const showTimer = conn === ConnectionState.Connected;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{streamTitle}</p>
          <p className="text-xs text-muted-foreground">Phòng LiveKit — bạn là chủ phòng</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${connectionBadgeClass(conn)}`}
          >
            {connectionLabel(conn)}
          </span>
          {showTimer ? (
            <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs tabular-nums text-foreground">
              {formatElapsed(elapsedMs)}
            </span>
          ) : null}
          <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
            {inRoom} người trong phòng
          </span>
        </div>
      </header>

      <div className="relative flex min-h-0 w-full flex-1 flex-col bg-black/[0.04] dark:bg-black/50">
        <VideoConference className="h-full min-h-0 w-full flex-1" />
      </div>

      <footer className="border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        Gợi ý: kiểm tra mic/camera trước khi bệnh nhân vào phòng. Nếu video không lên, xem quyền trình duyệt và chọn thiết bị
        trong menu cài đặt trên thanh điều khiển LiveKit.
      </footer>
    </div>
  );
}

export function DoctorLiveStudio({
  serverUrl,
  token,
  streamId,
  streamTitle,
  onDisconnected,
}: DoctorLiveStudioProps) {
  const { show } = useToast();

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      audio
      video
      onDisconnected={onDisconnected}
      onError={(err) => {
        console.error(err);
        show({
          title: 'LiveKit',
          message: err instanceof Error ? err.message : 'Lỗi kết nối phòng live. Kiểm tra LIVEKIT_* và mạng.',
          variant: 'error',
        });
      }}
      className="flex w-full min-h-[min(72vh,680px)] flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row xl:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <LiveSessionMain streamTitle={streamTitle} />
        </div>
        <LiveShareSidebar streamId={streamId} streamTitle={streamTitle} />
      </div>
    </LiveKitRoom>
  );
}
