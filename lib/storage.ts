import { promises as fs } from 'fs';
import path from 'path';
import { env } from '@/lib/env';

export const storageRoot = env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

function safeResolve(relativePath: string): string {
  const normalized = path.posix.normalize(relativePath).replace(/^[\/\\]+/, '');
  if (normalized.split('/').some((seg) => seg === '..')) {
    throw new Error('Invalid path');
  }
  return path.join(storageRoot, normalized);
}

export function resolvePath(relativePath: string): string {
  return safeResolve(relativePath);
}

export async function saveFile(relativePath: string, buffer: Buffer): Promise<void> {
  const abs = safeResolve(relativePath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buffer);
}

export async function readFile(relativePath: string): Promise<Buffer> {
  return fs.readFile(safeResolve(relativePath));
}

export async function deleteFile(relativePath: string): Promise<void> {
  try {
    await fs.unlink(safeResolve(relativePath));
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}

export async function fileExists(relativePath: string): Promise<boolean> {
  try {
    await fs.access(safeResolve(relativePath));
    return true;
  } catch {
    return false;
  }
}
