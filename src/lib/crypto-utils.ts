import * as Crypto from 'expo-crypto';

/**
 * Generate a cryptographically secure random number in [0, 1).
 * Uses expo-crypto getRandomBytes for true randomness.
 */
export async function secureRandomFloat(): Promise<number> {
  const bytes = await Crypto.getRandomBytesAsync(4);
  const uint32 = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  return (uint32 >>> 0) / 0x100000000;
}

/**
 * Generate a secure random number in the range [min, max).
 */
export async function secureRandom(min: number, max: number): Promise<number> {
  const float = await secureRandomFloat();
  return min + float * (max - min);
}

/**
 * Generate a secure random ID string.
 */
export async function secureRandomId(prefix: string): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(8);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}_${Date.now()}_${hex}`;
}
