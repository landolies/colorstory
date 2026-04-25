import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Trash2 } from 'lucide-react';
import type { ColorBlock, SavedStory } from '../lib/types';
import {
  blockLayoutFor,
  computePositioned,
  SEAM_RATIO,
} from '../lib/tile-layout';
import { haptics } from '../lib/platform';

const TILE_SHADOW = 'drop-shadow(0 2px 6px hsl(0 0% 0% / 0.3))';
const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 8;

interface SavedStoriesProps {
  stories: SavedStory[];
  onTap: (story: SavedStory) => void;
  onEdit: (story: SavedStory) => void;
  onDelete: (story: SavedStory) => void;
}

export function SavedStories({
  stories,
  onTap,
  onEdit,
  onDelete,
}: SavedStoriesProps) {
  if (stories.length === 0) return null;

  const className =
    stories.length > 1
      ? 'mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3'
      : 'mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3';

  const sorted = [...stories].sort((a, b) => {
    const aDate = a.updatedAt ?? a.createdAt;
    const bDate = b.updatedAt ?? b.createdAt;
    return bDate.localeCompare(aDate);
  });

  return (
    <section className={className}>
      {sorted.map((story) => (
        <ArchiveEntry
          key={story.id}
          story={story}
          onTap={() => onTap(story)}
          onEdit={() => onEdit(story)}
          onDelete={() => onDelete(story)}
        />
      ))}
    </section>
  );
}

function ArchiveEntry({
  story,
  onTap,
  onEdit,
  onDelete,
}: {
  story: SavedStory;
  onTap: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const cancel = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  };

  useEffect(() => () => cancel(), []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    start.current = { x: e.clientX, y: e.clientY };
    timer.current = window.setTimeout(() => {
      timer.current = null;
      haptics.pulse();
      onEdit();
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE) cancel();
  };

  const handlePointerUp = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
      start.current = null;
      onTap();
    }
  };

  return (
    <div
      role="button"
      aria-label={`${story.name}: tap to copy, long-press to edit`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancel}
      className="flex select-none flex-col [touch-action:manipulation]"
    >
      <MiniTile blocks={story.colors} />
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-serif text-lg text-ink">
            {story.name}
          </div>
          <div className="text-xs text-ink/60">
            {story.colors.length} colors ·{' '}
            {formatDate(story.updatedAt ?? story.createdAt)}
          </div>
        </div>
        <button
          type="button"
          onPointerUp={(e) => {
            e.stopPropagation();
            cancel();
            onDelete();
          }}
          aria-label={`Delete ${story.name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/50 [touch-action:manipulation]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MiniTile({ blocks }: { blocks: ColorBlock[] }) {
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

  const positioned = computePositioned(blocks);

  return (
    <div
      ref={ref}
      style={{ filter: TILE_SHADOW }}
      className="relative aspect-[3/2] w-full"
    >
      {positioned.map((p) => (
        <MiniSwatch
          key={p.block.id}
          hex={p.block.hex}
          index={p.index}
          total={p.total}
          startPct={p.startPct}
          endPct={p.endPct}
        />
      ))}
    </div>
  );
}

function MiniSwatch({
  hex,
  index,
  total,
  startPct,
  endPct,
}: {
  hex: string;
  index: number;
  total: number;
  startPct: number;
  endPct: number;
}) {
  const layout = blockLayoutFor(index, total, startPct, endPct);

  const outerStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    height: '100%',
    left: layout.left,
    width: layout.width,
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
  };

  const innerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: hex,
    clipPath: layout.clipPath,
  };

  return (
    <div style={outerStyle}>
      <div style={innerStyle} />
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
