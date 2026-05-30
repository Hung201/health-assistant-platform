'use client';

import { useRef, useState } from 'react';
import { ConnectionState, Track, RemoteAudioTrack } from 'livekit-client';
import {
  RoomAudioRenderer,
  StartAudio,
  VideoTrack,
  useConnectionState,
  useTracks,
  useRemoteParticipants,
} from '@livekit/components-react';
import { Volume2, VolumeX } from 'lucide-react';

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

/** Waiting placeholder with animated ring */
function WaitingPlaceholder({ hint }: { hint: string }) {
  return (
    <div className="flex min-h-[440px] flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      {/* Animated spinner */}
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/10" />
        <span className="relative inline-flex h-10 w-10 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
      </span>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-white/90">{hint}</p>
        <p className="text-xs text-white/40">
          Hình ảnh sẽ xuất hiện tự động khi bác sĩ bật camera.
        </p>
      </div>
    </div>
  );
}

/** Volume slider that controls remote participant audio tracks */
function VolumeControl() {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const prevVolume = useRef(1);
  const remoteParticipants = useRemoteParticipants();

  const applyVolume = (vol: number) => {
    remoteParticipants.forEach((p) => {
      p.audioTrackPublications.forEach((pub) => {
        if (pub.track && pub.track instanceof RemoteAudioTrack) {
          (pub.track as RemoteAudioTrack).setVolume(vol);
        }
      });
    });
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) {
      setMuted(true);
    } else {
      setMuted(false);
      prevVolume.current = val;
    }
    applyVolume(val);
  };

  const toggleMute = () => {
    if (muted) {
      const restored = prevVolume.current > 0 ? prevVolume.current : 1;
      setMuted(false);
      setVolume(restored);
      applyVolume(restored);
    } else {
      prevVolume.current = volume > 0 ? volume : 1;
      setMuted(true);
      setVolume(0);
      applyVolume(0);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-b-xl bg-black/70 px-4 py-2.5 backdrop-blur-sm">
      <button
        type="button"
        onClick={toggleMute}
        title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        className="shrink-0 text-white/70 transition-colors hover:text-white"
      >
        {muted || volume === 0 ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={handleSlider}
        aria-label="Âm lượng"
        className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
      />
      <span className="min-w-[2rem] text-right text-xs tabular-nums text-white/50">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
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
    remoteTracks.find((t) => t.source === Track.Source.ScreenShare && t.publication) ??
    remoteTracks.find((t) => t.source === Track.Source.Camera && t.publication);

  const waiting = conn === ConnectionState.Connected && !primary;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-black">
      {primary?.publication ? (
        <VideoTrack
          trackRef={primary}
          className="h-full min-h-[440px] w-full object-contain"
        />
      ) : (
        <WaitingPlaceholder hint={connectionHint(conn)} />
      )}
      <RoomAudioRenderer />

      {/* Volume control bar — only shown when connected */}
      {conn === ConnectionState.Connected && !waiting ? (
        <VolumeControl />
      ) : null}

      {/* Start audio prompt */}
      <div className="pointer-events-none absolute inset-x-0 bottom-12 z-10 flex justify-center pb-3 [&>button]:pointer-events-auto">
        <StartAudio label="Bật âm thanh (nếu trình duyệt chặn tự phát)" />
      </div>
    </div>
  );
}
