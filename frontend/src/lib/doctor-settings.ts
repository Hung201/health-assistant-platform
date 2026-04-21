export type DoctorPortalSettings = {
  reminderEnabled: boolean;
  reminderLeadMinutes: number;
  notifyByEmail: boolean;
  notifyBySms: boolean;
  defaultSlotDurationMinutes: number;
  defaultMaxBookings: number;
};

export const DOCTOR_PORTAL_SETTINGS_KEY = 'doctor.portal.settings.v1';

export const defaultDoctorPortalSettings: DoctorPortalSettings = {
  reminderEnabled: true,
  reminderLeadMinutes: 60,
  notifyByEmail: true,
  notifyBySms: false,
  defaultSlotDurationMinutes: 30,
  defaultMaxBookings: 5,
};

function toPositiveInt(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.round(n);
}

export function loadDoctorPortalSettings(): DoctorPortalSettings {
  if (typeof window === 'undefined') return defaultDoctorPortalSettings;
  try {
    const raw = window.localStorage.getItem(DOCTOR_PORTAL_SETTINGS_KEY);
    if (!raw) return defaultDoctorPortalSettings;
    const parsed = JSON.parse(raw) as Partial<DoctorPortalSettings>;
    return {
      reminderEnabled: parsed.reminderEnabled ?? defaultDoctorPortalSettings.reminderEnabled,
      reminderLeadMinutes: toPositiveInt(parsed.reminderLeadMinutes, defaultDoctorPortalSettings.reminderLeadMinutes),
      notifyByEmail: parsed.notifyByEmail ?? defaultDoctorPortalSettings.notifyByEmail,
      notifyBySms: parsed.notifyBySms ?? defaultDoctorPortalSettings.notifyBySms,
      defaultSlotDurationMinutes: toPositiveInt(
        parsed.defaultSlotDurationMinutes,
        defaultDoctorPortalSettings.defaultSlotDurationMinutes,
      ),
      defaultMaxBookings: Math.min(
        50,
        Math.max(1, toPositiveInt(parsed.defaultMaxBookings, defaultDoctorPortalSettings.defaultMaxBookings)),
      ),
    };
  } catch {
    return defaultDoctorPortalSettings;
  }
}

export function saveDoctorPortalSettings(value: DoctorPortalSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DOCTOR_PORTAL_SETTINGS_KEY, JSON.stringify(value));
}
