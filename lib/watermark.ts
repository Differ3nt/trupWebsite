export interface WatermarkOptions {
  isThumbnail?: boolean;
}

export async function watermarkImage(input: Buffer, _options: WatermarkOptions = {}): Promise<Buffer> {
  return input;
}
