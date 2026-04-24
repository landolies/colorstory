import { type CSSProperties } from 'react';
import type { ColorBlock } from '../lib/types';

interface SwatchProps {
  block: ColorBlock;
  index: number;
  total: number;
  onTap: (id: string) => void;
}

function clipPathFor(index: number, total: number): string | undefined {
  if (total === 1) return undefined;
  if (index === 0) {
    return 'polygon(0 0, 100% 0, calc(100% - var(--seam-x)) 100%, 0 100%)';
  }
  if (index === total - 1) {
    return 'polygon(0 0, 100% 0, 100% 100%, calc(0px - var(--seam-x)) 100%)';
  }
  return 'polygon(0 0, 100% 0, calc(100% - var(--seam-x)) 100%, calc(0px - var(--seam-x)) 100%)';
}

export function Swatch({ block, index, total, onTap }: SwatchProps) {
  const style: CSSProperties = {
    flex: block.weight === 'major' ? 3 : 1,
    backgroundColor: block.hex,
    clipPath: clipPathFor(index, total),
  };
  return (
    <div
      role="button"
      aria-label={`Color ${block.hex}`}
      onPointerUp={() => onTap(block.id)}
      style={style}
      className="h-full select-none [touch-action:manipulation]"
    />
  );
}
