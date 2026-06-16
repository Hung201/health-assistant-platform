'use client';

import { useState } from 'react';
import { Track } from 'livekit-client';
import {
  DisconnectButton,
  TrackToggle,
  useMediaDeviceSelect,
} from '@livekit/components-react';
import { LogOut, Mic, MonitorUp, Settings, Video } from 'lucide-react';

import { LiveCenterModal } from '@/app/(doctor)/doctor/live/live-center-modal';

const barBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50';

const barBtnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50';

function DeviceSelectSection({
  kind,
  title,
}: {
  kind: MediaDeviceKind;
  title: string;
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind,
    requestPermissions: true,
  });

  if (devices.length === 0) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">Không tìm thấy thiết bị.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
        {devices.map((device) => {
          const active = device.deviceId === activeDeviceId;
          return (
            <li key={device.deviceId}>
              <button
                type="button"
                onClick={() => void setActiveMediaDevice(device.deviceId)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                }`}
              >
                {device.label || 'Thiết bị không tên'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LiveSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <LiveCenterModal open={open} onClose={onClose} maxWidthClass="max-w-md" labelledBy="live-settings-title">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h3 id="live-settings-title" className="text-lg font-bold text-foreground">
          Cài đặt thiết bị
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Chọn microphone và camera dùng khi phát trực tiếp.</p>
        <div className="mt-5 space-y-5">
          <DeviceSelectSection kind="audioinput" title="Microphone" />
          <DeviceSelectSection kind="videoinput" title="Camera" />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Đóng
          </button>
        </div>
      </div>
    </LiveCenterModal>
  );
}

/** Thanh điều khiển tùy chỉnh — thay ControlBar mặc định (nền đen). */
export function DoctorLiveControlBar() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <LiveSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className="border-t border-slate-200 bg-slate-50/95 px-3 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <TrackToggle source={Track.Source.Microphone} showIcon={false} className={barBtn}>
            <Mic className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Mic</span>
          </TrackToggle>

          <TrackToggle source={Track.Source.Camera} showIcon={false} className={barBtn}>
            <Video className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Camera</span>
          </TrackToggle>

          <TrackToggle source={Track.Source.ScreenShare} showIcon={false} className={barBtn}>
            <MonitorUp className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Chia sẻ màn hình</span>
          </TrackToggle>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={barBtn}
            aria-label="Cài đặt thiết bị"
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Cài đặt</span>
          </button>

          <DisconnectButton className={barBtnDanger} stopTracks>
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Rời phòng
          </DisconnectButton>
        </div>
      </div>
    </>
  );
}
