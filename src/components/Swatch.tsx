import {
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useSortable } from '@dnd-kit/sortable';
import type { ColorBlock } from '../lib/types';
import type { Mode } from '../state/editor';
import { haptics } from '../lib/platform';

interface SwatchProps {
  block: ColorBlock;
  index: number;
  total: number;
  startPct: number;
  endPct: number;
  mode: Mode;
  isAnyDragging: boolean;
  onTap: (id: string) => void;
}

interface Layout {
  left: string;
  width: string;
  clipPath: string | undefined;
  borderRadius: string;
}

const TAP_TOLERANCE = 6;
const CORNER_RADIUS = 12;
const BLOCK_SHADOW = 'drop-shadow(0 2px 6px hsl(0 0% 0% / 0.3))';
const DND_TRANSITION = {
  duration: 350,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
};

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

export function Swatch({
  block,
  index,
  total,
  startPct,
  endPct,
  mode,
  isAnyDragging,
  onTap,
}: SwatchProps) {
  const layout = layoutFor(index, total, startPct, endPct);
  const isEdit = mode === 'edit';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: dndTransition,
    isDragging,
  } = useSortable({ id: block.id, transition: DND_TRANSITION });

  const dragTransform = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  const tapStart = useRef<{ x: number; y: number } | null>(null);

  const dndPointerDown = listeners?.onPointerDown as
    | ((e: ReactPointerEvent<HTMLDivElement>) => void)
    | undefined;

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    tapStart.current = { x: e.clientX, y: e.clientY };
    if (isEdit && dndPointerDown) dndPointerDown(e);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = tapStart.current;
    tapStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > TAP_TOLERANCE) return;
    if (isEdit) haptics.tap();
    onTap(block.id);
  };

  const pistonAnimation =
    isEdit && !isAnyDragging
      ? `piston-${index % 2 === 0 ? 'a' : 'b'} 0.65s ease-in-out infinite`
      : undefined;

  const layoutTransition = 'left 0.35s ease, width 0.35s ease';
  const combinedTransition = dndTransition
    ? `${layoutTransition}, ${dndTransition}`
    : layoutTransition;

  const outerStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    height: '100%',
    left: layout.left,
    width: layout.width,
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
    filter: isEdit ? BLOCK_SHADOW : undefined,
    transform: dragTransform,
    transition: combinedTransition,
    animation: pistonAnimation,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const innerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: block.hex,
    clipPath: layout.clipPath,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      role="button"
      aria-label={`Color ${block.hex}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={outerStyle}
      className="select-none"
    >
      <div style={innerStyle} />
    </div>
  );
}
