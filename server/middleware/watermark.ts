import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const CACHE_DIR = path.join(UPLOADS_DIR, '.wm-cache');
const LOGO_PATH = path.join(process.cwd(), 'public', 'logo.png');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.webp', '.png']);

const LOGO_RATIO_FULL = 0.15;
const LOGO_RATIO_THUMB = 0.18;
const LOGO_MIN_PX = 30;
const PADDING_RATIO = 0.015;

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Builds a white logo with drop shadow, matching the CSS:
//   filter: brightness(0) invert(1) drop-shadow(0 1px 4px rgba(0,0,0,0.85))
//   opacity: 0.9
async function buildWatermarkLogo(logoW: number): Promise<Buffer> {
  const resized = await sharp(LOGO_PATH).resize(logoW).ensureAlpha().toBuffer();
  const { width: lw = logoW, height: lh = logoW } = await sharp(resized).metadata();
  const { data, info } = await sharp(resized).raw().toBuffer({ resolveWithObject: true });

  // White at 90% opacity
  const whiteData = Buffer.from(data);
  for (let i = 0; i < whiteData.length; i += 4) {
    whiteData[i] = whiteData[i + 1] = whiteData[i + 2] = 255;
    whiteData[i + 3] = Math.round(whiteData[i + 3] * 0.9);
  }
  const whitePng = await sharp(whiteData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();

  // Shadow: black at 85% opacity, blurred
  const shadowData = Buffer.from(data);
  for (let i = 0; i < shadowData.length; i += 4) {
    shadowData[i] = shadowData[i + 1] = shadowData[i + 2] = 0;
    shadowData[i + 3] = Math.round(shadowData[i + 3] * 0.85);
  }
  const blurR = Math.max(1, Math.round(lw * 0.02));
  const shadowPng = await sharp(shadowData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).blur(blurR).png().toBuffer();

  // Composite onto a padded transparent canvas: shadow offset 1-2px, white logo on top
  const pad = blurR + 3;
  return sharp({
    create: { width: lw + pad, height: lh + pad, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: shadowPng, top: 2, left: 2 },
      { input: whitePng, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function compositeWatermark(inputPath: string, outputPath: string): Promise<void> {
  const img = sharp(inputPath);
  const { width = 800, height = 600 } = await img.metadata();

  const isThumb = path.basename(inputPath).includes('-thumb.');
  const logoW = Math.max(LOGO_MIN_PX, Math.round(width * (isThumb ? LOGO_RATIO_THUMB : LOGO_RATIO_FULL)));
  const padding = Math.max(8, Math.round(width * PADDING_RATIO));

  const logoBuffer = await buildWatermarkLogo(logoW);
  const { width: lw = logoW, height: lh = logoW } = await sharp(logoBuffer).metadata();

  const top = Math.max(0, height - lh - padding);
  const left = Math.max(0, width - lw - padding);

  const ext = path.extname(outputPath).toLowerCase();
  const pipeline = img.composite([{ input: logoBuffer, top, left }]);

  if (ext === '.webp') {
    await pipeline.webp({ quality: 75 }).toFile(outputPath);
  } else {
    await pipeline.jpeg({ quality: 90 }).toFile(outputPath);
  }
}

export function watermarkMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.query.raw === '1') return next();

  const ext = path.extname(req.path).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return next();

  const filename = path.basename(req.path);
  if (!filename || filename.startsWith('.')) return next();

  const originalPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(originalPath)) return next();

  const cachePath = path.join(CACHE_DIR, filename);
  const originalMtime = fs.statSync(originalPath).mtimeMs;

  const serveFromCache = () => {
    const ext2 = path.extname(cachePath).toLowerCase();
    res.setHeader('Content-Type', ext2 === '.webp' ? 'image/webp' : 'image/jpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(cachePath);
  };

  if (fs.existsSync(cachePath) && fs.statSync(cachePath).mtimeMs >= originalMtime) {
    serveFromCache();
    return;
  }

  compositeWatermark(originalPath, cachePath)
    .then(serveFromCache)
    .catch((err) => {
      console.error('[WM] Failed to watermark', filename, err.message);
      next();
    });
}

export function invalidateWatermarkCache(originalUrl: string): void {
  const filename = path.basename(originalUrl);
  const cachePath = path.join(CACHE_DIR, filename);
  if (fs.existsSync(cachePath)) {
    try { fs.unlinkSync(cachePath); } catch { /* ignore */ }
  }
}
