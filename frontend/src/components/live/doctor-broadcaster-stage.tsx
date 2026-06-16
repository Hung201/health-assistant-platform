'use client';

import { ConnectionState, Track } from 'livekit-client';
import {
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react';

import { DoctorLiveControlBar } from './doctor-live-control-bar';

function connectionHint(state: ConnectionState): string {
  switch (state) {
    case ConnectionState.Connecting:
      return 'Đang kết nối phòng live…';
    case ConnectionState.Reconnecting:
    case ConnectionState.SignalReconnecting:
      return 'Đang kết nối lại…';
    case ConnectionState.Disconnected:
      return 'Mất kết nối.';
    default:
      return 'Bật camera để hiển thị hình ảnh';
  }
}

/** Chỉ hiển thị video của bác sĩ (local), không hiện tile khán giả. */
export function DoctorBroadcasterStage() {
  const conn = useConnectionState();
  const { localParticipant } = useLocalParticipant();

  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const localTracks = tracks.filter((ref) => ref.participant.isLocal);
  const primary =
    localTracks.find((t) => t.source === Track.Source.ScreenShare && t.publication) ??
    localTracks.find((t) => t.source === Track.Source.Camera && t.publication);

  const displayName =
    localParticipant?.name?.trim() ||
    localParticipant?.identity?.trim() ||
    'Bác sĩ';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-xl bg-black">
      <div className="relative min-h-[min(50vh,520px)] flex-1">
        {primary?.publication ? (
          <VideoTrack trackRef={primary} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="relative flex h-12 w-12 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/10" />
              <span className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            </span>
            <p className="text-sm font-medium text-white/80">{connectionHint(conn)}</p>
          </div>
        )}
        {primary?.publication ? (
          <div className="pointer-events-none absolute bottom-3 left-3 max-w-[80%] truncate rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            {displayName}
          </div>
        ) : null}
      </div>

      <DoctorLiveControlBar />
    </div>
  );
}
