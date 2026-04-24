import { useEffect, useRef, type CSSProperties } from 'react';
import type { ColorBlock, Weight } from '../lib/types';
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

const weightOf = (w: Weight) => (w === 'major' ? 3 : 1);

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

  const totalWeight =
    blocks.reduce((s, b) => s + weightOf(b.weight), 0) || 1;
  let cumulative = 0;
  const positioned = blocks.map((b, i) => {
    const w = weightOf(b.weight);
    const startPct = (cumulative / totalWeight) * 100;
    cumulative += w;
    const endPct = (cumulative / totalWeight) * 100;
    return { block: b, startPct, endPct, index: i, total: blocks.length };
  });

  const style: CSSProperties = { clipPath: MITERED_OCTAGON };

  return (
    <div
      ref={ref}
      style={style}
      className="relative aspect-[3/2] w-full overflow-hidden bg-paper-elevated [--miter:12px]"
    >
      {positioned.map((p) => (
        <Swatch
          key={p.block.id}
          block={p.block}
          index={p.index}
          total={p.total}
          startPct={p.startPct}
          endPct={p.endPct}
          onTap={onSwatchTap}
        />
      ))}
    </div>
  );
}
