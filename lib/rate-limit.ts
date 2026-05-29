import { NextRequest, NextResponse } from 'next/server';

// Application-level rate limiter (in-memory, per-instance). Cloudflare WAF is the
// PRIMARY edge rate limit for the deployment (REBUILD_PLAN Phase 1 §5); this is a
// lightweight backstop for the single long-lived LXC Node.js process — no Redis
// needed at this scale. State resets on restart, which is acceptable for a backstop.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export interface RateLimitOptions {
  /** Unique bucket name for this endpoint (e.g. 'upload', 'push-broadcast'). */
  name: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Fixed-window rate limit keyed by endpoint name + client IP. Returns a ready-to-
 * return 429 `NextResponse` when the limit is exceeded, or `null` when the request
 * may proceed. Usage at the top of a Route Handler:
 *
 *   const limited = enforceRateLimit(request, { name: 'upload', limit: 30, windowMs: 60_000 });
 *   if (limited) return limited;
 */
export function enforceRateLimit(req: NextRequest, opts: RateLimitOptions): NextResponse | null {
  const now = Date.now();
  const key = `${opts.name}:${clientIp(req)}`;
  const b = buckets.get(key);

  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
  } else {
    b.count++;
    if (b.count > opts.limit) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }
  }

  // Opportunistic cleanup so the Map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
  }
  return null;
}
