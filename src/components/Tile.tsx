import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ColorBlock, Weight } from '../lib/types';
import type { Mode } from '../state/editor';
import { Swatch } from './Swatch';
import { haptics } from '../lib/platform';

interface TileProps {
  blocks: ColorBlock[];
  mode: Mode;
  onSwatchTap: (id: string) => void;
  onSwatchRemove: (id: string) => void;
  onLongPress: () => void;
  onReorder: (event: DragEndEvent) => void;
}

const SEAM_RATIO = 0.25;
const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 8;
const SWIPE_REMOVE_DISTANCE = 80;
const SWIPE_DOMINANCE = 1.2;
const TILE_SHADOW = 'drop-shadow(0 2px 6px hsl(0 0% 0% / 0.3))';

const weightOf = (w: Weight) => (w === 'major' ? 3 : 1);

interface ActiveDrag {
  block: ColorBlock;
  width: number;
  height: number;
  seamX: number;
  position: 'first' | 'last' | 'interior' | 'single';
}

export function Tile({
  blocks,
  mode,
  onSwatchTap,
  onSwatchRemove,
  onLongPress,
  onReorder,
}: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);
  const suppressNextSwatchTap = useRef(false);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

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

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressStart.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimer.current !== null) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (mode === 'edit') return;
    longPressStart.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = window.setTimeout(() => {
      haptics.pulse();
      suppressNextSwatchTap.current = true;
      onLongPress();
      longPressTimer.current = null;
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!longPressStart.current) return;
    const dx = e.clientX - longPressStart.current.x;
    const dy = e.clientY - longPressStart.current.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE) cancelLongPress();
  };

  const handlePointerUp = useCallback(() => {
    cancelLongPress();
    suppressNextSwatchTap.current = false;
  }, [cancelLongPress]);

  const wrappedTap = useCallback(
    (id: string) => {
      if (suppressNextSwatchTap.current) {
        suppressNextSwatchTap.current = false;
        return;
      }
      onSwatchTap(id);
    },
    [onSwatchTap],
  );

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  );

  const ids = blocks.map((b) => b.id);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const block = blocks[idx];
    const rect = event.active.rect.current.initial;
    const seamX = ref.current ? ref.current.clientHeight * SEAM_RATIO : 0;
    const position: ActiveDrag['position'] =
      blocks.length === 1
        ? 'single'
        : idx === 0
          ? 'first'
          : idx === blocks.length - 1
            ? 'last'
            : 'interior';
    setActiveDrag({
      block,
      width: rect?.width ?? 100,
      height: rect?.height ?? 80,
      seamX,
      position,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, delta } = event;
    if (
      Math.abs(delta.y) > SWIPE_REMOVE_DISTANCE &&
      Math.abs(delta.y) > Math.abs(delta.x) * SWIPE_DOMINANCE
    ) {
      haptics.tap();
      onSwatchRemove(active.id as string);
      return;
    }
    onReorder(event);
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
  };

  const isEdit = mode === 'edit';
  const isAnyDragging = activeDrag !== null;
  const tileStyle = isEdit ? undefined : { filter: TILE_SHADOW };

  return (
    <div
      ref={ref}
      style={tileStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative aspect-[3/2] w-full [user-select:none] [-webkit-touch-callout:none] [-webkit-user-select:none] ${
        isEdit ? '[touch-action:none]' : '[touch-action:pan-y]'
      }`}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={ids}
          strategy={horizontalListSortingStrategy}
        >
          {positioned.map((p) => (
            <Swatch
              key={p.block.id}
              block={p.block}
              index={p.index}
              total={p.total}
              startPct={p.startPct}
              endPct={p.endPct}
              mode={mode}
              isAnyDragging={isAnyDragging}
              onTap={wrappedTap}
            />
          ))}
        </SortableContext>
        <DragOverlay
          dropAnimation={{
            duration: 220,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {activeDrag ? <DragPreview drag={activeDrag} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function DragPreview({ drag }: { drag: ActiveDrag }) {
  const { block, width, height, seamX, position } = drag;

  const clipPath =
    position === 'single'
      ? undefined
      : position === 'first'
        ? 'polygon(0 0, 100% 0, calc(100% - var(--seam-x)) 100%, 0 100%)'
        : position === 'last'
          ? 'polygon(var(--seam-x) 0, 100% 0, 100% 100%, 0 100%)'
          : 'polygon(var(--seam-x) 0, 100% 0, calc(100% - var(--seam-x)) 100%, 0 100%)';

  const borderRadius =
    position === 'single'
      ? '12px'
      : position === 'first'
        ? '12px 0 0 12px'
        : position === 'last'
          ? '0 12px 12px 0'
          : '0';

  const outerStyle: CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius,
    overflow: 'hidden',
    filter: 'drop-shadow(0 20px 44px hsl(0 0% 0% / 0.6))',
    animation: 'lift-in 0.18s ease-out forwards',
    pointerEvents: 'none',
    ['--seam-x' as keyof CSSProperties]: `${seamX}px`,
  } as CSSProperties;

  const innerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: block.hex,
    clipPath,
  };

  return (
    <div style={outerStyle}>
      <div style={innerStyle} />
    </div>
  );
}
