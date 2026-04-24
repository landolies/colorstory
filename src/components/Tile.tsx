import { useEffect, useRef, type CSSProperties } from 'react';
import type { ColorBlock } from '../lib/types';
import { Swatch } from './Swatch';

interface TileProps {
  blocks: ColorBlock[];
  onSwatchTap: (id: string) => void;
}

const SEAM_RATIO = 0.25;

const MITERED_OCTAGON =
  'polygon(' +
  'var(--miter) 0, calc(100% - var(--miter)) 0, ' +
  '100% var(--miter), 100% calc(100% - var(--miter)), ' +
  'calc(100% - var(--miter)) 100%, var(--miter) 100%, ' +
  '0 calc(100% - var(--miter)), 0 var(--miter)' +
  ')';

export function Tile({ blocks, onSwatchTap }: TileProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      el.style.setProperty('--seam-x', `${el.clientHeight * SEAM_RATIO}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const style: CSSProperties = { clipPath: MITERED_OCTAGON };

  return (
    <div
      ref={ref}
      style={style}
      className="relative flex aspect-[3/2] w-full overflow-hidden bg-paper-elevated [--miter:12px]"
    >
      {blocks.map((block, i) => (
        <Swatch
          key={block.id}
          block={block}
          index={i}
          total={blocks.length}
          onTap={onSwatchTap}
        />
      ))}
    </div>
  );
}
