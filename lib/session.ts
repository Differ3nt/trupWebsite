import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { env } from '@/lib/env';

export type AuthResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

export type SessionData = {
  userId: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'FLAGGED';
  email: string;
};

export async function getSession(): Promise<SessionData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    role: session.user.role,
    status: session.user.status,
    email: session.user.email,
  };
}

export async function requireUser(): Promise<AuthResult<SessionData>> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { ok: true, data: session };
}

export async function requireAdmin(): Promise<AuthResult<SessionData>> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, data: session };
}

export async function requireOwnerSafe(
  session: SessionData,
  targetUserId: string,
  targetEmail?: string
): Promise<AuthResult<void>> {
  const ownerEmail = env.OWNER_EMAIL;
  if (session.role === 'ADMIN') {
    if (ownerEmail && targetEmail === ownerEmail) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Cannot modify owner account' }, { status: 403 }),
      };
    }
    return { ok: true, data: undefined };
  }
  if (session.userId !== targetUserId) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, data: undefined };
}
