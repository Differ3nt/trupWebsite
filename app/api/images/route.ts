import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { enforceRateLimit } from '@/lib/rate-limit';
import { requireUser } from '@/lib/session';
import { handleApiError } from '@/lib/api-errors';
import { saveFile } from '@/lib/storage';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { name: 'upload', limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      if (!(file instanceof File)) continue;

      const albumId = formData.get('albumId') as string | null;
      if (!albumId) return NextResponse.json({ error: 'albumId is required' }, { status: 400 });

      const name = (formData.get('name') as string) || file.name;
      const tagsRaw = formData.get('tags') as string | null;
      const tagNames = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const metadata = await sharp(inputBuffer).metadata();
      const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      // Process original: resize to max 1920px, JPEG 90%
      const origBuffer = await sharp(inputBuffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      const origPath = `${suffix}-orig.jpg`;
      await saveFile(origPath, origBuffer);

      // Process thumbnail: 400px, WebP
      const thumbBuffer = await sharp(inputBuffer)
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();
      const thumbPath = `${suffix}-thumb.webp`;
      await saveFile(thumbPath, thumbBuffer);

      // Process tags
      const tagIds = await Promise.all(
        tagNames.map(n => prisma.tag.upsert({ where: { name: n }, update: {}, create: { name: n } }))
      );

      const image = await prisma.image.create({
        data: {
          name,
          albumId,
          originalUrl: `/uploads/${origPath}`,
          thumbnailUrl: `/uploads/${thumbPath}`,
          width: metadata.width,
          height: metadata.height,
          size: file.size,
          tags: { connect: tagIds.map(t => ({ id: t.id })) },
        },
        include: { tags: true },
      });
      results.push(image);
    }
    return NextResponse.json({ success: true, images: results }, { status: 201 });
  } catch (err) {
    return handleApiError(err, '[images POST]');
  }
}
