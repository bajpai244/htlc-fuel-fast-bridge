import { expect, test, describe } from 'bun:test';
import { generateRandom32Bytes, generateRandom32BytesHex, sha256 } from '../src/utils';
import { app } from '../src/server'; // Make sure to export 'app' from server.ts

describe('Utils', () => {
  test('generateRandom32Bytes should return a Buffer of length 32', () => {
    const result = generateRandom32Bytes();
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(32);
  });

  test('generateRandom32BytesHex should return a string of length 64', () => {
    const result = generateRandom32BytesHex();
    expect(typeof result).toBe('string');
    expect(result.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(result)).toBe(true);
  });

  test('generateRandom32BytesHex should return different values on subsequent calls', () => {
    const result1 = generateRandom32BytesHex();
    const result2 = generateRandom32BytesHex();
    expect(result1).not.toBe(result2);
  });

  test('sha256 should return a valid hash for a string input', () => {
    const input = 'Hello, World!';
    const result = sha256(input);
    expect(typeof result).toBe('string');
    expect(result.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    expect(result).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
  });

  test('sha256 should return a valid hash for a Buffer input', () => {
    const input = Buffer.from('Hello, World!');
    const result = sha256(input);
    expect(typeof result).toBe('string');
    expect(result.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    expect(result).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
  });

  test('POST /create-job should return a job ID', async () => {
    const response = await app.request('/create-job', {
      method: 'POST',
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('jobId');
    expect(typeof data.jobId).toBe('string');
    expect(data.jobId.length).toBe(64);
  });
});
