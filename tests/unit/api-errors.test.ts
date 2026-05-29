import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError, z } from 'zod';
import { handleApiError } from '@/lib/api-errors';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('handleApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 with issues for ZodError', async () => {
    const schema = z.object({ name: z.string() });
    let zodErr: ZodError | null = null;
    try {
      schema.parse({ name: 123 });
    } catch (e) {
      zodErr = e as ZodError;
    }

    expect(zodErr).not.toBeNull();
    const res = handleApiError(zodErr!, '[test]');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it('returns 500 for generic errors', async () => {
    const res = handleApiError(new Error('boom'), '[test]');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 for unknown error types', async () => {
    const res = handleApiError('some string error', '[test]');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });
});
