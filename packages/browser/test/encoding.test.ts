import { describe, it, expect } from 'vitest';
import {
  bufferToBase64Url,
  base64UrlToBuffer,
  base64UrlToUint8Array,
  uint8ArrayToBase64Url,
} from '../src/encoding';

describe('encoding', () => {
  describe('bufferToBase64Url', () => {
    it('should encode buffer to base64url', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
      const encoded = bufferToBase64Url(buffer);
      
      expect(encoded).toBeDefined();
      expect(typeof encoded).toBe('string');
      expect(encoded).toBe('SGVsbG8');
    });

    it('should not include padding', () => {
      const buffer = new Uint8Array([72, 101]).buffer;
      const encoded = bufferToBase64Url(buffer);
      
      expect(encoded.includes('=')).toBe(false);
    });

    it('should use URL-safe characters', () => {
      const buffer = new Uint8Array(100).fill(255).buffer;
      const encoded = bufferToBase64Url(buffer);
      
      expect(encoded.includes('+')).toBe(false);
      expect(encoded.includes('/')).toBe(false);
    });
  });

  describe('base64UrlToBuffer', () => {
    it('should decode base64url to buffer', () => {
      const encoded = 'SGVsbG8';
      const buffer = base64UrlToBuffer(encoded);
      const array = new Uint8Array(buffer);
      
      expect(array).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    it('should handle URL-safe characters', () => {
      const encoded = 'SGVsbG8tV29ybGQ_';
      const buffer = base64UrlToBuffer(encoded);
      
      expect(buffer).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('base64UrlToUint8Array', () => {
    it('should decode to Uint8Array', () => {
      const encoded = 'SGVsbG8';
      const array = base64UrlToUint8Array(encoded);
      
      expect(array).toBeInstanceOf(Uint8Array);
      expect(array).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });
  });

  describe('uint8ArrayToBase64Url', () => {
    it('should encode Uint8Array to base64url', () => {
      const array = new Uint8Array([72, 101, 108, 108, 111]);
      const encoded = uint8ArrayToBase64Url(array);
      
      expect(encoded).toBe('SGVsbG8');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve data through encoding and decoding', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const encoded = uint8ArrayToBase64Url(original);
      const decoded = base64UrlToUint8Array(encoded);
      
      expect(decoded).toEqual(original);
    });

    it('should work with empty array', () => {
      const original = new Uint8Array([]);
      const encoded = uint8ArrayToBase64Url(original);
      const decoded = base64UrlToUint8Array(encoded);
      
      expect(decoded).toEqual(original);
    });

    it('should work with large arrays', () => {
      const original = new Uint8Array(1000).map((_, i) => i % 256);
      const encoded = uint8ArrayToBase64Url(original);
      const decoded = base64UrlToUint8Array(encoded);
      
      expect(decoded).toEqual(original);
    });
  });
});
