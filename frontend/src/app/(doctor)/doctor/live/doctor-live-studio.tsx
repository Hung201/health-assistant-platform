'use client';

import { useEffect, useRef, useState } from 'react';
import { ConnectionState, Track } from 'livekit-client';
import {
  LiveKitRoom,
  VideoConference,
  useConnectionState,
  useTrackToggle,
} from '@livekit/components-react';

import { Mic, MicOff, QrCode, Video, VideoOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { useToast } from '@/components/ui/toast';
import { LiveCenterModal } from './live-center-modal';

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

function DeviceToggleButton({ kind }: { kind: 'microphone' | 'camera' }) {
  const source = kind === 'microphone' ? Track.Source.Microphone : Track.Source.Camera;
  const { enabled, toggle } = useTrackToggle({ source });

  const isMic = kind === 'microphone';
  const label = isMic
    ? enabled ? 'Microphone: BẬT — nhấn để tắt' : 'Microphone: TẮT — nhấn để bật'
    : enabled ? 'Camera: BẬT — nhấn để tắt' : 'Camera: TẮT — nhấn để bật';

  const Icon = isMic ? (enabled ? Mic : MicOff) : (enabled ? Video : VideoOff);

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => toggle()}
      className={`relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
        enabled
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60'
          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60'
      }`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-red-500'}`}
        aria-hidden
      />
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{isMic ? 'Mic' : 'Camera'}</span>
    </button>
  );
}

function usePublicLiveUrl(streamId: string) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    setUrl(`${window.location.origin}/live/${streamId}`);
  }, [streamId]);
  return url;
}

function QrCodeModal({
  open,
  onClose,
  streamId,
  streamTitle,
}: {
  open: boolean;
  onClose: () => void;
  streamId: string;
  streamTitle: string;
}) {
  const { show } = useToast();
  const publicUrl = usePublicLiveUrl(streamId);

  const copyLink = () => {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(publicUrl).then(
      () => show({ message: 'Đã sao chép liên kết.', variant: 'success' }),
      () => show({ message: 'Không thể sao chép tự động.', variant: 'error' }),
    );
  };

  return (
    <LiveCenterModal open={open} onClose={onClose} maxWidthClass="max-w-sm" labelledBy="qr-modal-title">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h3 id="qr-modal-title" className="text-lg font-bold text-foreground">
          Quét để xem live
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground" title={streamTitle}>
          {streamTitle}
        </p>
        {publicUrl ? (
          <>
            <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
              <QRCodeSVG value={publicUrl} size={220} level="M" includeMargin />
            </div>
            <p className="mt-3 break-all text-center font-mono text-xs text-muted-foreground">{publicUrl}</p>
          </>
        ) : (
          <p className="mt-4 text-center text-sm text-muted-foreground">Đang tạo liên kết…</p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            disabled={!publicUrl}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
          >
            Sao chép link
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Đóng
          </button>
        </div>
      </div>
    </LiveCenterModal>
  );
}

function LiveSessionMain({
  streamId,
  streamTitle,
}: {
  streamId: string;
  streamTitle: string;
}) {
  const conn = useConnectionState();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);
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

  const showTimer = conn === ConnectionState.Connected;

  return (
    <>
      <QrCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        streamId={streamId}
        streamTitle={streamTitle}
      />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{streamTitle}</p>
            <p className="text-xs text-muted-foreground">Đang phát trực tiếp</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <QrCode className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Mã QR</span>
            </button>
            <DeviceToggleButton kind="microphone" />
            <DeviceToggleButton kind="camera" />
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${connectionBadgeClass(conn)}`}
          >
            {connectionLabel(conn)}
          </span>
          {showTimer ? (
            <span className="rounded-lg border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs tabular-nums text-foreground">
              {formatElapsed(elapsedMs)}
            </span>
          ) : null}
        </div>
      </header>

      <div className="relative flex min-h-0 w-full flex-1 flex-col bg-black/[0.04] dark:bg-black/50">
        <VideoConference className="h-full min-h-0 w-full flex-1" />
      </div>

      <footer className="border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        Kiểm tra mic/camera trước khi phát. Nếu video không lên, xem quyền trình duyệt và chọn thiết bị trong thanh
        điều khiển LiveKit.
      </footer>
    </div>
    </>
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
      <LiveSessionMain streamId={streamId} streamTitle={streamTitle} />
    </LiveKitRoom>
  );
}
