import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';

export function handleApiError(err: unknown, context: string): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid input', issues: err.issues }, { status: 400 });
  }
  logger.error({ err, context }, 'API error');
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
