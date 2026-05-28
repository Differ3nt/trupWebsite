import sharp from 'sharp';
import path from 'path';

const LOGO_PATH = path.join(process.cwd(), 'public', 'logo.png');
const LOGO_RATIO_FULL = 0.15;
const LOGO_RATIO_THUMB = 0.18;
const LOGO_MIN_PX = 30;
const PADDING_RATIO = 0.015;

export interface WatermarkOptions {
  isThumbnail?: boolean;
  outputFormat?: 'jpeg' | 'webp';
}

// Builds a white logo with drop shadow, matching the CSS appearance:
//   filter: brightness(0) invert(1) drop-shadow(0 1px 4px rgba(0,0,0,0.85)); opacity: 0.9
async function buildWatermarkLogo(logoW: number): Promise<Buffer> {
  const resized = await sharp(LOGO_PATH).resize(logoW).ensureAlpha().toBuffer();
  const { width: lw = logoW, height: lh = logoW } = await sharp(resized).metadata();
  const { data, info } = await sharp(resized).raw().toBuffer({ resolveWithObject: true });

  // White pixels, 90% opacity
  const whiteData = Buffer.from(data);
  for (let i = 0; i < whiteData.length; i += 4) {
    whiteData[i] = whiteData[i + 1] = whiteData[i + 2] = 255;
    whiteData[i + 3] = Math.round(whiteData[i + 3] * 0.9);
  }
  const whitePng = await sharp(whiteData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  // Black shadow pixels, 85% opacity, blurred
  const shadowData = Buffer.from(data);
  for (let i = 0; i < shadowData.length; i += 4) {
    shadowData[i] = shadowData[i + 1] = shadowData[i + 2] = 0;
    shadowData[i + 3] = Math.round(shadowData[i + 3] * 0.85);
  }
  const blurR = Math.max(1, Math.round(lw * 0.02));
  const shadowPng = await sharp(shadowData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .blur(blurR)
    .png()
    .toBuffer();

  // Composite onto a padded transparent canvas: shadow offset 2px down-right, white logo on top
  const pad = blurR + 3;
  return sharp({
    create: {
      width: lw + pad,
      height: lh + pad,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: shadowPng, top: 2, left: 2 },
      { input: whitePng, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

/**
 * Overlays the TRUP watermark onto an image buffer.
 * Position: bottom-right corner with padding proportional to image width.
 * Returns the composited buffer in the requested output format.
 */
export async function watermarkImage(input: Buffer, options: WatermarkOptions = {}): Promise<Buffer> {
  const { isThumbnail = false, outputFormat = 'jpeg' } = options;

  const img = sharp(input);
  const { width = 800, height = 600 } = await img.metadata();

  const logoW = Math.max(
    LOGO_MIN_PX,
    Math.round(width * (isThumbnail ? LOGO_RATIO_THUMB : LOGO_RATIO_FULL)),
  );
  const padding = Math.max(8, Math.round(width * PADDING_RATIO));
  const logoBuffer = await buildWatermarkLogo(logoW);
  const { width: lw = logoW, height: lh = logoW } = await sharp(logoBuffer).metadata();

  const top = Math.max(0, height - lh - padding);
  const left = Math.max(0, width - lw - padding);

  const pipeline = img.composite([{ input: logoBuffer, top, left }]);

  return outputFormat === 'webp'
    ? pipeline.webp({ quality: 75 }).toBuffer()
    : pipeline.jpeg({ quality: 90 }).toBuffer();
}
