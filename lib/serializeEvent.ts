/**
 * Single source of truth for event sensitive-field stripping (plan §9).
 *
 * The live site masks logistic/sensitive fields from viewers who aren't
 * entitled to them. Previously this list lived inline in the events API
 * routes and was skipped entirely by the RSC page fetches (leaking the
 * fields to guests). Both now go through here.
 */
export const SENSITIVE_EVENT_FIELDS = [
  'mapLink',
  'mapEmbed',
  'gearRequired',
  'gearCritical',
  'transport',
  'meetingPointLink',
  'meetingPointEmbed',
] as const;

export interface EventViewer {
  authenticated: boolean;
  role?: 'USER' | 'ADMIN' | null;
  status?: string | null;
  /** True if the viewer participates in this specific event. */
  isParticipant?: boolean;
}

/**
 * Visibility rule (§14.1 three-layer):
 *  - guest (not logged in)        → masked
 *  - inactive/flagged user        → full data ONLY for events they joined
 *  - active member / admin        → full data
 */
export function canSeeSensitive(viewer: EventViewer): boolean {
  if (!viewer.authenticated) return false;
  if (viewer.role === 'ADMIN') return true;
  if (viewer.status === 'ACTIVE') return true;
  return !!viewer.isParticipant;
}

/** Returns the event with sensitive fields removed when the viewer isn't entitled. */
export function serializeEvent<T extends Record<string, unknown>>(event: T, viewer: EventViewer): T {
  if (canSeeSensitive(viewer)) return event;
  const copy = { ...event };
  for (const field of SENSITIVE_EVENT_FIELDS) {
    delete copy[field];
  }
  return copy;
}
