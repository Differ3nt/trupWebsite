import { NextResponse } from 'next/server';

/**
 * Shared upload guards (security hardening §4).
 *
 * Upload routes previously passed the raw File straight to sharp / disk with no
 * size or type check, allowing disk/memory exhaustion (large files) and type
 * confusion (non-image/non-GPX payloads). Every upload route funnels through
 * `validateUpload` so the limits live in one place.
 */

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_GPX_BYTES = 10 * 1024 * 1024; // 10 MB

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// Browsers are inconsistent about the MIME type for .gpx files (often
// application/octet-stream or an empty string), so GPX is allowed by extension too.
export const GPX_MIME_TYPES = ['application/gpx+xml', 'application/xml', 'text/xml'];

interface ValidateOptions {
  maxBytes: number;
  allowedTypes: string[];
  /** Extensions (lowercase, with dot) accepted as a fallback when the MIME type is missing/generic. */
  allowedExtensions?: string[];
}

/**
 * Returns a 413/415 NextResponse if the file violates the size or type guard,
 * or `null` if the file is acceptable.
 */
export function validateUpload(file: File, opts: ValidateOptions): NextResponse | null {
  if (file.size === 0) {
    return NextResponse.json({ error: 'Plik jest pusty' }, { status: 400 });
  }
  if (file.size > opts.maxBytes) {
    const mb = Math.round(opts.maxBytes / 1024 / 1024);
    return NextResponse.json({ error: `Plik jest za duży (maks. ${mb} MB)` }, { status: 413 });
  }

  const type = (file.type || '').toLowerCase();
  const typeOk = opts.allowedTypes.includes(type);
  const extOk =
    opts.allowedExtensions?.some((ext) => file.name.toLowerCase().endsWith(ext)) ?? false;

  if (!typeOk && !extOk) {
    return NextResponse.json({ error: 'Nieobsługiwany typ pliku' }, { status: 415 });
  }
  return null;
}
