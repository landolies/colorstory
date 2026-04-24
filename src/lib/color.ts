export interface RandomColorOptions {
  hueRange?: [number, number];
  saturationRange?: [number, number];
  lightnessRange?: [number, number];
}

const DEFAULTS = {
  hueRange: [0, 360] as [number, number],
  saturationRange: [45, 80] as [number, number],
  lightnessRange: [38, 70] as [number, number],
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) =>
    lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function randomPleasantColor(opts: RandomColorOptions = {}): string {
  const cfg = { ...DEFAULTS, ...opts };
  const h = randomInRange(cfg.hueRange[0], cfg.hueRange[1]);
  const s = randomInRange(cfg.saturationRange[0], cfg.saturationRange[1]);
  const l = randomInRange(cfg.lightnessRange[0], cfg.lightnessRange[1]);
  return hslToHex(h, s, l);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export type ReadableTextColor = 'ink' | 'paper';

export function readableTextColor(hex: string): ReadableTextColor {
  return relativeLuminance(hex) > 0.5 ? 'ink' : 'paper';
}
