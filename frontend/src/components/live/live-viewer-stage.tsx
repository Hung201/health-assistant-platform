'use client';

import { ConnectionState, Track } from 'livekit-client';
import {
  RoomAudioRenderer,
  StartAudio,
  VideoTrack,
  useConnectionState,
  useTracks,
} from '@livekit/components-react';

function connectionHint(state: ConnectionState): string {
  switch (state) {
    case ConnectionState.Connecting:
      return 'Đang kết nối phòng live…';
    case ConnectionState.Reconnecting:
    case ConnectionState.SignalReconnecting:
      return 'Đang kết nối lại…';
    case ConnectionState.Disconnected:
      return 'Mất kết nối. Tải lại trang để thử lại.';
    default:
      return 'Đang chờ bác sĩ bật camera…';
  }
}

/** Chỉ hiển thị video/audio từ người phát (bác sĩ), không dùng VideoConference (ưu tiên tile local). */
export function LiveViewerStage() {
  const conn = useConnectionState();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );

  const remoteTracks = tracks.filter((ref) => !ref.participant.isLocal);
  const primary =
    remoteTracks.find((t) => t.source === Track.Source.ScreenShare) ??
    remoteTracks.find((t) => t.source === Track.Source.Camera);

  const waiting = conn === ConnectionState.Connected && !primary;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-black">
      {primary ? (
        <VideoTrack
          trackRef={primary}
          className="h-full min-h-[440px] w-full object-contain"
        />
      ) : (
        <div className="flex min-h-[440px] flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-white/80">
          <p className="text-sm font-medium">{connectionHint(conn)}</p>
          {waiting ? (
            <p className="text-xs text-white/50">
              Bác sĩ đã vào phòng; khi bật camera, hình sẽ hiện tự động.
            </p>
          ) : null}
        </div>
      )}
      <RoomAudioRenderer />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-3 [&>button]:pointer-events-auto">
        <StartAudio label="Bật âm thanh (nếu trình duyệt chặn tự phát)" />
      </div>
    </div>
  );
}
