import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Plus, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import type { ColorBlock, Weight } from '../lib/types';
import { randomPleasantColor } from '../lib/color';
import { Tile } from '../components/Tile';
import { ActionRow } from '../components/ActionRow';

const MAX_COLORS = 5;

const MITERED_OCTAGON =
  'polygon(' +
  'var(--miter) 0, calc(100% - var(--miter)) 0, ' +
  '100% var(--miter), 100% calc(100% - var(--miter)), ' +
  'calc(100% - var(--miter)) 100%, var(--miter) 100%, ' +
  '0 calc(100% - var(--miter)), 0 var(--miter)' +
  ')';

type PendingAction =
  | { type: 'add'; weight: Weight }
  | { type: 'recolor'; id: string }
  | null;

function newId(): string {
  return crypto.randomUUID();
}

export function Index() {
  const [blocks, setBlocks] = useState<ColorBlock[]>([]);
  const [pending, setPending] = useState<PendingAction>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback((action: Exclude<PendingAction, null>) => {
    setPending(action);
    inputRef.current?.click();
  }, []);

  const handlePicked = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const hex = event.target.value.toLowerCase();
      const action = pending;
      setPending(null);
      event.target.value = '#000000';
      if (!action) return;
      if (action.type === 'add') {
        setBlocks((prev) => {
          if (prev.length >= MAX_COLORS) return prev;
          return [...prev, { id: newId(), hex, weight: action.weight }];
        });
      } else {
        setBlocks((prev) =>
          prev.map((b) => (b.id === action.id ? { ...b, hex } : b)),
        );
      }
    },
    [pending],
  );

  const addColor = useCallback(() => {
    if (blocks.length >= MAX_COLORS) {
      toast('Max 5');
      return;
    }
    const weight: Weight = blocks.length === 0 ? 'major' : 'minor';
    openPicker({ type: 'add', weight });
  }, [blocks.length, openPicker]);

  const shuffleColor = useCallback(() => {
    setBlocks((prev) => {
      if (prev.length >= MAX_COLORS) {
        toast('Max 5');
        return prev;
      }
      const weight: Weight = prev.length === 0 ? 'major' : 'minor';
      return [...prev, { id: newId(), hex: randomPleasantColor(), weight }];
    });
  }, []);

  const recolor = useCallback(
    (id: string) => openPicker({ type: 'recolor', id }),
    [openPicker],
  );

  const discard = useCallback(() => setBlocks([]), []);

  const isEmpty = blocks.length === 0;

  return (
    <main className="mx-auto w-full max-w-screen-sm px-4 pt-6">
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handlePicked}
      />
      <div className="relative">
        {isEmpty ? (
          <EmptyCanvas onTap={addColor} />
        ) : (
          <Tile blocks={blocks} onSwatchTap={recolor} />
        )}
        {!isEmpty && (
          <FloatingButton
            position="top-right"
            ariaLabel="Add color"
            onTap={addColor}
            icon={<Plus className="h-4 w-4" />}
          />
        )}
        <FloatingButton
          position="bottom-right"
          ariaLabel="Add random color"
          onTap={shuffleColor}
          icon={<Shuffle className="h-4 w-4" />}
        />
      </div>
      {!isEmpty && (
        <ActionRow canSave={false} onDiscard={discard} onSave={() => {}} />
      )}
    </main>
  );
}

function EmptyCanvas({ onTap }: { onTap: () => void }) {
  const style: CSSProperties = { clipPath: MITERED_OCTAGON };
  return (
    <section
      onPointerUp={onTap}
      style={style}
      className="flex aspect-[3/2] w-full select-none items-center justify-center bg-paper-elevated [--miter:12px] [touch-action:manipulation]"
    >
      <Plus className="h-14 w-14 text-ink/40" strokeWidth={1.25} />
    </section>
  );
}

interface FloatingButtonProps {
  position: 'top-right' | 'bottom-right';
  ariaLabel: string;
  onTap: () => void;
  icon: ReactNode;
}

function FloatingButton({
  position,
  ariaLabel,
  onTap,
  icon,
}: FloatingButtonProps) {
  const positionClass =
    position === 'top-right' ? 'right-2 top-2' : 'right-2 bottom-2';
  return (
    <button
      type="button"
      onPointerUp={(e) => {
        e.stopPropagation();
        onTap();
      }}
      aria-label={ariaLabel}
      className={`absolute ${positionClass} flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink shadow-md ring-1 ring-rule/60 [touch-action:manipulation]`}
    >
      {icon}
    </button>
  );
}
