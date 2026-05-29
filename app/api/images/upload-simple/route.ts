import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { enforceRateLimit } from '@/lib/rate-limit';
import { requireUser } from '@/lib/session';
import { handleApiError } from '@/lib/api-errors';
import { saveFile } from '@/lib/storage';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { name: 'upload-avatar', limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `avatar-${suffix}.jpg`;

    const processed = await sharp(inputBuffer)
      .resize({ width: 400, height: 400, fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    await saveFile(filename, processed);

    // Update user avatarUrl in DB
    await prisma.user.update({
      where: { id: auth.data.userId },
      data: { avatarUrl: `/uploads/${filename}` },
    });

    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (err) {
    return handleApiError(err, '[images upload-simple POST]');
  }
}
