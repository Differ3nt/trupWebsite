import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { rsvpSchema } from '@/lib/validations/rsvp';
import { idSchema } from '@/lib/validations/common';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    const body = await request.json();
    rsvpSchema.parse(body);

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    console.error('[events rsvp POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
