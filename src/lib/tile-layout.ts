import type { ColorBlock, Weight } from './types';

export const CORNER_RADIUS = 12;
export const SEAM_RATIO = 0.25;

export interface BlockLayout {
  left: string;
  width: string;
  clipPath: string | undefined;
  borderRadius: string;
}

export interface PositionedBlock {
  block: ColorBlock;
  index: number;
  total: number;
  startPct: number;
  endPct: number;
}

const weightOf = (w: Weight): number => (w === 'major' ? 3 : 1);

export function computePositioned(blocks: ColorBlock[]): PositionedBlock[] {
  const totalWeight = blocks.reduce((s, b) => s + weightOf(b.weight), 0) || 1;
  let cumulative = 0;
  return blocks.map((b, i) => {
    const w = weightOf(b.weight);
    const startPct = (cumulative / totalWeight) * 100;
    cumulative += w;
    const endPct = (cumulative / totalWeight) * 100;
    return { block: b, index: i, total: blocks.length, startPct, endPct };
  });
}

export function blockLayoutFor(
  index: number,
  total: number,
  startPct: number,
  endPct: number,
): BlockLayout {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isSingle = total === 1;

  if (isSingle) {
    return {
      left: '0',
      width: '100%',
      clipPath: undefined,
      borderRadius: `${CORNER_RADIUS}px`,
    };
  }
  if (isFirst) {
    return {
      left: '0',
      width: `calc(${endPct}% + var(--seam-x) / 2)`,
      clipPath:
        'polygon(0 0, 100% 0, calc(100% - var(--seam-x)) 100%, 0 100%)',
      borderRadius: `${CORNER_RADIUS}px 0 0 ${CORNER_RADIUS}px`,
    };
  }
  if (isLast) {
    return {
      left: `calc(${startPct}% - var(--seam-x) / 2)`,
      width: `calc(${100 - startPct}% + var(--seam-x) / 2)`,
      clipPath: 'polygon(var(--seam-x) 0, 100% 0, 100% 100%, 0 100%)',
      borderRadius: `0 ${CORNER_RADIUS}px ${CORNER_RADIUS}px 0`,
    };
  }
  return {
    left: `calc(${startPct}% - var(--seam-x) / 2)`,
    width: `calc(${endPct - startPct}% + var(--seam-x))`,
    clipPath:
      'polygon(var(--seam-x) 0, 100% 0, calc(100% - var(--seam-x)) 100%, 0 100%)',
    borderRadius: '0',
  };
}
