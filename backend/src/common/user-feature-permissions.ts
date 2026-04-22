import type { User } from '../entities/user.entity';

export type FeaturePermissionKey = 'livestream';

export type FeaturePermissionsState = Partial<Record<FeaturePermissionKey, boolean>>;

export function normalizeFeaturePermissions(raw: unknown): FeaturePermissionsState {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const out: FeaturePermissionsState = {};
  if (typeof o.livestream === 'boolean') out.livestream = o.livestream;
  return out;
}

/** Quyền livestream: chỉ khi admin bật rõ ràng (`livestream: true`). */
export function userMayLivestream(user: Pick<User, 'featurePermissions'>): boolean {
  return normalizeFeaturePermissions(user.featurePermissions).livestream === true;
}

export function mergeFeaturePermissions(
  current: unknown,
  patch: FeaturePermissionsState,
): FeaturePermissionsState {
  const base = normalizeFeaturePermissions(current);
  return { ...base, ...patch };
}
