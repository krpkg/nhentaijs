import { describe, it, expect } from 'vitest';
import { parseGalleryId, getExtension, sanitizeFilename } from './utils';

describe('parseGalleryId', () => {
  it('parses numeric ID strings and numbers', () => {
    expect(parseGalleryId('521265')).toBe('521265');
    expect(parseGalleryId(521265)).toBe('521265');
  });

  it('parses full nhentai URLs', () => {
    expect(parseGalleryId('https://nhentai.net/g/521265/')).toBe('521265');
    expect(parseGalleryId('https://nhentai.net/g/521265/1/')).toBe('521265');
  });

  it('parses relative paths', () => {
    expect(parseGalleryId('/g/521265')).toBe('521265');
  });

  it('throws on invalid inputs', () => {
    expect(() => parseGalleryId('invalid-string')).toThrow();
  });
});

describe('getExtension', () => {
  it('maps nhentai type codes to image extensions', () => {
    expect(getExtension('j')).toBe('jpg');
    expect(getExtension('p')).toBe('png');
    expect(getExtension('g')).toBe('gif');
    expect(getExtension('w')).toBe('webp');
  });
});

describe('sanitizeFilename', () => {
  it('cleans invalid path characters', () => {
    expect(sanitizeFilename('Foo: Bar / Baz?')).toBe('Foo Bar  Baz');
  });
});
