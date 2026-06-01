import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { enforceRateLimit } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/session';
import { handleApiError } from '@/lib/api-errors';
import { saveFile } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { validateUpload, MAX_IMAGE_BYTES, IMAGE_MIME_TYPES } from '@/lib/uploadValidation';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { name: 'upload-asset', limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireAdmin();
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

      const invalid = validateUpload(file, { maxBytes: MAX_IMAGE_BYTES, allowedTypes: IMAGE_MIME_TYPES });
      if (invalid) return invalid;

      const name = (formData.get('name') as string) || file.name;
      const tagsRaw = formData.get('tags') as string | null;
      const tagNames = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const metadata = await sharp(inputBuffer).metadata();
      const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      const origBuffer = await sharp(inputBuffer)
        .jpeg({ quality: 95, force: false })
        .toBuffer();
      const origPath = `${suffix}-asset.jpg`;
      await saveFile(origPath, origBuffer);

      const thumbBuffer = await sharp(inputBuffer)
        .resize({ width: 600, height: 600, fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
      const thumbPath = `${suffix}-asset-thumb.webp`;
      await saveFile(thumbPath, thumbBuffer);

      const tagIds = await Promise.all(
        tagNames.map(n => prisma.tag.upsert({ where: { name: n }, update: {}, create: { name: n } }))
      );

      const image = await prisma.image.create({
        data: {
          name,
          albumId: null,
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
    return handleApiError(err, '[images upload-asset POST]');
  }
}
