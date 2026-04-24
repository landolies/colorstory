import { type CSSProperties } from 'react';
import type { ColorBlock } from '../lib/types';

interface SwatchProps {
  block: ColorBlock;
  index: number;
  total: number;
  startPct: number;
  endPct: number;
  onTap: (id: string) => void;
}

interface Layout {
  left: string;
  width: string;
  clipPath: string | undefined;
}

function layoutFor(
  index: number,
  total: number,
  startPct: number,
  endPct: number,
): Layout {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isSingle = total === 1;

  if (isSingle) {
    return { left: '0', width: '100%', clipPath: undefined };
  }
  if (isFirst) {
    return {
      left: '0',
      width: `${endPct}%`,
      clipPath:
        'polygon(0 0, 100% 0, calc(100% - var(--seam-x)) 100%, 0 100%)',
    };
  }
  if (isLast) {
    return {
      left: `calc(${startPct}% - var(--seam-x))`,
      width: `calc(${100 - startPct}% + var(--seam-x))`,
      clipPath: 'polygon(var(--seam-x) 0, 100% 0, 100% 100%, 0 100%)',
    };
  }
  return {
    left: `calc(${startPct}% - var(--seam-x))`,
    width: `calc(${endPct - startPct}% + var(--seam-x))`,
    clipPath:
      'polygon(var(--seam-x) 0, 100% 0, calc(100% - var(--seam-x)) 100%, 0 100%)',
  };
}

export function Swatch({
  block,
  index,
  total,
  startPct,
  endPct,
  onTap,
}: SwatchProps) {
  const layout = layoutFor(index, total, startPct, endPct);
  const style: CSSProperties = {
    position: 'absolute',
    top: 0,
    height: '100%',
    left: layout.left,
    width: layout.width,
    backgroundColor: block.hex,
    clipPath: layout.clipPath,
  };
  return (
    <div
      role="button"
      aria-label={`Color ${block.hex}`}
      onPointerUp={() => onTap(block.id)}
      style={style}
      className="select-none [touch-action:manipulation]"
    />
  );
}
