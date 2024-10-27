import crypto from 'node:crypto';

/**
 * Generates a random 32-byte value
 * @returns {Buffer} A Buffer containing 32 random bytes
 */
export function generateRandom32Bytes(): Buffer {
  return crypto.randomBytes(32);
}

/**
 * Generates a random 32-byte value and returns it as a hexadecimal string
 * @returns {string} A hexadecimal string representation of 32 random bytes
 */
export function generateRandom32BytesHex(): string {
  return generateRandom32Bytes().toString('hex');
}

/**
 * Computes the SHA256 hash of the input
 * @param {string | Buffer} input - The input to hash
 * @returns {string} The hexadecimal string representation of the SHA256 hash
 */
export function sha256(input: string | Buffer): `0x${string}` {
  return `0x${crypto.createHash('sha256').update(input).digest('hex')}`;
}
