import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizer for admin-supplied map embed snippets (security hardening §1).
 *
 * `mapEmbed` / `meetingPointEmbed` are rendered with dangerouslySetInnerHTML on
 * the event page. They are meant to hold a single <iframe> map embed, so we
 * strip everything that isn't an allowlisted map iframe. This neutralises stored
 * XSS even if an admin account is compromised or pastes untrusted HTML.
 *
 * The host allowlist mirrors the CSP `frame-src` directive in middleware.ts.
 */
const ALLOWED_IFRAME_HOSTS = [
  'google.com',
  'mapy.cz',
  'frame.mapy.cz',
  'openstreetmap.org',
];

function isAllowedSrc(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:') return false;
    return ALLOWED_IFRAME_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith('.' + host),
    );
  } catch {
    return false;
  }
}

// Drop any <iframe> whose src isn't on the host allowlist. DOMPurify can't do
// host allowlisting via config, so we enforce it in a hook. Registered once at
// module load — this module is the only consumer of DOMPurify.
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName !== 'iframe') return;
  const el = node as unknown as Element;
  const src = el.getAttribute?.('src') ?? '';
  if (!isAllowedSrc(src)) {
    el.parentNode?.removeChild(el);
  }
});

/**
 * Returns a sanitized embed string safe to store and later render. Only
 * allowlisted map <iframe>s survive; everything else is stripped. Empty/invalid
 * input returns ''.
 */
export function sanitizeEmbed(raw: string | null | undefined): string {
  if (!raw) return '';
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['iframe'],
    ALLOWED_ATTR: [
      'src',
      'width',
      'height',
      'style',
      'allowfullscreen',
      'loading',
      'referrerpolicy',
      'frameborder',
      'allow',
      'title',
    ],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  }).trim();
}
