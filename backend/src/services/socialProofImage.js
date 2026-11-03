import { createHash } from 'crypto';
import fs from 'fs/promises';
import sharp from 'sharp';

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

export class SocialProofValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'SocialProofValidationError';
    this.code = code;
  }
}

function bitsToHex(bits) {
  let result = '';
  for (let index = 0; index < bits.length; index += 4) {
    const chunk = bits.slice(index, index + 4).join('');
    result += Number.parseInt(chunk, 2).toString(16);
  }
  return result;
}

export function perceptualHashDistance(left, right) {
  if (!/^[0-9a-f]{16}$/i.test(String(left || '')) || !/^[0-9a-f]{16}$/i.test(String(right || ''))) {
    return Number.POSITIVE_INFINITY;
  }

  let distance = 0;
  for (let index = 0; index < 16; index += 1) {
    const xor = Number.parseInt(left[index], 16) ^ Number.parseInt(right[index], 16);
    distance += xor.toString(2).replace(/0/g, '').length;
  }
  return distance;
}

export async function validateAndFingerprintSocialProof(filePath, options = {}) {
  const maxBytes = options.maxBytes || Number.parseInt(process.env.SOCIAL_CLAIM_MAX_IMAGE_BYTES || '5242880', 10);
  const maxPixels = options.maxPixels || Number.parseInt(process.env.SOCIAL_CLAIM_MAX_IMAGE_PIXELS || '20000000', 10);
  const minimumDimension = options.minimumDimension || 200;
  const stat = await fs.stat(filePath);
  if (!stat.isFile() || stat.size <= 0 || stat.size > maxBytes) {
    throw new SocialProofValidationError('Screenshot exceeds the allowed file size.', 'INVALID_IMAGE_SIZE');
  }

  let pipeline;
  let metadata;
  try {
    pipeline = sharp(filePath, { failOn: 'error', limitInputPixels: maxPixels });
    metadata = await pipeline.metadata();
  } catch {
    throw new SocialProofValidationError('Screenshot could not be decoded.', 'INVALID_IMAGE_DATA');
  }

  if (!ALLOWED_FORMATS.has(metadata.format)) {
    throw new SocialProofValidationError('Upload a PNG, JPG, or WEBP screenshot.', 'UNSUPPORTED_IMAGE_FORMAT');
  }
  if (!metadata.width || !metadata.height || metadata.width < minimumDimension || metadata.height < minimumDimension) {
    throw new SocialProofValidationError('Screenshot dimensions are too small to verify.', 'INVALID_IMAGE_DIMENSIONS');
  }
  if (metadata.width * metadata.height > maxPixels) {
    throw new SocialProofValidationError('Screenshot dimensions exceed the verification limit.', 'INVALID_IMAGE_PIXELS');
  }

  const normalized = await sharp(filePath, { failOn: 'error', limitInputPixels: maxPixels })
    .rotate()
    .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const proofSha256 = createHash('sha256').update(normalized).digest('hex');
  const { data } = await sharp(normalized).resize(9, 8, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const bits = [];
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const offset = row * 9 + column;
      bits.push(data[offset] > data[offset + 1] ? 1 : 0);
    }
  }

  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    normalized,
    proofSha256,
    proofPerceptualHash: bitsToHex(bits),
  };
}
