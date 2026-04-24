import { describe, it, expect } from 'vitest';
import { randomPleasantColor, readableTextColor } from '../../src/lib/color';

describe('randomPleasantColor', () => {
  it('returns a 7-char lowercase hex', () => {
    for (let i = 0; i < 100; i++) {
      const c = randomPleasantColor();
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('respects custom ranges without crashing on degenerate spans', () => {
    const c = randomPleasantColor({
      hueRange: [0, 1],
      saturationRange: [50, 51],
      lightnessRange: [50, 51],
    });
    expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('readableTextColor', () => {
  it('returns ink over light backgrounds', () => {
    expect(readableTextColor('#ffffff')).toBe('ink');
    expect(readableTextColor('#f5f5f5')).toBe('ink');
    expect(readableTextColor('#fce8b2')).toBe('ink');
  });

  it('returns paper over dark backgrounds', () => {
    expect(readableTextColor('#000000')).toBe('paper');
    expect(readableTextColor('#222244')).toBe('paper');
    expect(readableTextColor('#1a1a1a')).toBe('paper');
  });
});
