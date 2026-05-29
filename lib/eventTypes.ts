/**
 * Single source of truth for how each event type is presented (badge color +
 * calendar block color). Previously this map was duplicated in EventsClient
 * and CalendarClient with raw palette classes; both now import from here.
 *
 * Colors use the semantic state tokens (see app/globals.css) so the visual
 * result is identical to before but driven by named tokens.
 */
export const EVENT_TYPE_STYLES: Record<string, { badge: string; block: string }> = {
  'GÓRY': { badge: 'bg-primary text-surface', block: 'bg-primary text-surface' },
  'INTEGRACJA': { badge: 'bg-warning text-surface', block: 'bg-warning text-surface' },
  'KULTURA': { badge: 'bg-info text-white', block: 'bg-info text-white' },
};

export const EVENT_TYPE_FALLBACK = {
  badge: 'bg-surface-variant text-on-surface-variant',
  block: 'bg-surface-variant text-on-surface-variant',
};

export function eventTypeBadge(type: string): string {
  return EVENT_TYPE_STYLES[type]?.badge ?? EVENT_TYPE_FALLBACK.badge;
}

export function eventTypeBlock(type: string): string {
  return EVENT_TYPE_STYLES[type]?.block ?? EVENT_TYPE_FALLBACK.block;
}
