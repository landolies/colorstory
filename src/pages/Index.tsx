import {
  useCallback,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { ColorBlock, SavedStory, Weight } from '../lib/types';
import { randomPleasantColor } from '../lib/color';
import { newId } from '../lib/id';
import { clipboard } from '../lib/platform';
import { Tile } from '../components/Tile';
import { ActionRow } from '../components/ActionRow';
import { NamingOverlay } from '../components/NamingOverlay';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SavedStories } from '../components/SavedStories';
import {
  editorReducer,
  initialEditorState,
  MAX_COLORS,
  MIN_COLORS_TO_SAVE,
} from '../state/editor';
import { useArchive } from '../state/archive';

const TILE_SHADOW = 'drop-shadow(0 2px 6px hsl(0 0% 0% / 0.3))';

type PendingAction =
  | { type: 'add'; weight: Weight }
  | { type: 'recolor'; id: string }
  | null;

function randomHex(): string {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
}

function adjacentDuplicate(
  blocks: { id: string; hex: string }[],
  id: string | null,
  hex: string,
): boolean {
  if (id === null) {
    const last = blocks[blocks.length - 1];
    return Boolean(last && last.hex === hex);
  }
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  const prev = blocks[idx - 1];
  const next = blocks[idx + 1];
  return Boolean((prev && prev.hex === hex) || (next && next.hex === hex));
}

function defaultStoryName(savedCount: number): string {
  return `Study №${String(savedCount + 1).padStart(3, '0')}`;
}

function nameInUse(
  stories: SavedStory[],
  name: string,
  excludeId?: string,
): boolean {
  const lower = name.toLowerCase();
  return stories.some(
    (s) => s.name.toLowerCase() === lower && s.id !== excludeId,
  );
}

function cloneColors(colors: ColorBlock[]): ColorBlock[] {
  return colors.map((c) => ({ ...c, id: newId() }));
}

export function Index() {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);
  const [pending, setPending] = useState<PendingAction>(null);
  const [namingOpen, setNamingOpen] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editingStoryName, setEditingStoryName] = useState<string | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<SavedStory | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { stories, addStory, updateStory, removeStory } = useArchive(() =>
    toast("Couldn't save"),
  );
  const { mode, blocks } = state;
  const isAtMax = blocks.length >= MAX_COLORS;
  const canSave = blocks.length >= MIN_COLORS_TO_SAVE;

  const openPicker = useCallback((action: Exclude<PendingAction, null>) => {
    setPending(action);
    if (inputRef.current) {
      inputRef.current.value = randomHex();
    }
    inputRef.current?.click();
  }, []);

  const handlePicked = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const hex = event.target.value.toLowerCase();
      const action = pending;
      setPending(null);
      if (!action) return;
      if (action.type === 'add') {
        if (adjacentDuplicate(blocks, null, hex)) {
          toast('Same as adjacent');
          return;
        }
        dispatch({
          type: 'addBlock',
          block: { id: newId(), hex, weight: action.weight },
        });
      } else {
        if (adjacentDuplicate(blocks, action.id, hex)) {
          toast('Same as adjacent');
          return;
        }
        dispatch({ type: 'recolorBlock', id: action.id, hex });
      }
    },
    [pending, blocks],
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
    if (blocks.length >= MAX_COLORS) {
      toast('Max 5');
      return;
    }
    const last = blocks[blocks.length - 1];
    let hex = randomPleasantColor();
    let attempts = 0;
    while (last && last.hex === hex && attempts < 5) {
      hex = randomPleasantColor();
      attempts += 1;
    }
    if (last && last.hex === hex) {
      toast('Same as adjacent');
      return;
    }
    const weight: Weight = blocks.length === 0 ? 'major' : 'minor';
    dispatch({
      type: 'addBlock',
      block: { id: newId(), hex, weight },
    });
  }, [blocks]);

  const recolor = useCallback(
    (id: string) => openPicker({ type: 'recolor', id }),
    [openPicker],
  );

  const toggleWeight = useCallback(
    (id: string) => dispatch({ type: 'toggleWeight', id }),
    [],
  );

  const removeBlock = useCallback(
    (id: string) => dispatch({ type: 'removeBlock', id }),
    [],
  );

  const enterEdit = useCallback(() => dispatch({ type: 'enterEdit' }), []);
  const exitEdit = useCallback(() => dispatch({ type: 'exitEdit' }), []);

  const onReorder = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = blocks.map((b) => b.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      const newOrder = arrayMove(ids, oldIndex, newIndex);
      const blockMap = new Map(blocks.map((b) => [b.id, b]));
      for (let i = 1; i < newOrder.length; i++) {
        const a = blockMap.get(newOrder[i]);
        const b = blockMap.get(newOrder[i - 1]);
        if (a && b && a.hex === b.hex) {
          toast('Same as adjacent');
          return;
        }
      }
      dispatch({ type: 'reorderBlocks', ids: newOrder });
    },
    [blocks],
  );

  const discard = useCallback(() => {
    dispatch({ type: 'discardAll' });
    setEditingStoryId(null);
    setEditingStoryName(null);
  }, []);

  const openNaming = useCallback(() => {
    if (!canSave) return;
    setNamingOpen(true);
  }, [canSave]);

  const cancelNaming = useCallback(() => setNamingOpen(false), []);

  const confirmNaming = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (
        nameInUse(stories, trimmed, editingStoryId ?? undefined)
      ) {
        toast('Name already in use');
        return;
      }
      if (editingStoryId) {
        updateStory(editingStoryId, {
          name: trimmed,
          colors: blocks,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const story: SavedStory = {
          id: newId(),
          schemaVersion: 2,
          name: trimmed,
          colors: blocks,
          createdAt: new Date().toISOString(),
        };
        addStory(story);
      }
      dispatch({ type: 'discardAll' });
      setEditingStoryId(null);
      setEditingStoryName(null);
      setNamingOpen(false);
      toast('Saved');
    },
    [blocks, addStory, updateStory, stories, editingStoryId],
  );

  const copyStory = useCallback(async (story: SavedStory) => {
    const text = story.colors.map((c) => c.hex).join(', ');
    const result = await clipboard.write(text);
    if (result.ok) toast('Palette copied');
  }, []);

  const editStory = useCallback((story: SavedStory) => {
    dispatch({
      type: 'loadBlocks',
      blocks: cloneColors(story.colors),
    });
    setEditingStoryId(story.id);
    setEditingStoryName(story.name);
  }, []);

  const askDeleteStory = useCallback((story: SavedStory) => {
    setConfirmDelete(story);
  }, []);

  const cancelDelete = useCallback(() => setConfirmDelete(null), []);

  const performDelete = useCallback(() => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    removeStory(id);
    setConfirmDelete(null);
    if (editingStoryId === id) {
      dispatch({ type: 'discardAll' });
      setEditingStoryId(null);
      setEditingStoryName(null);
    }
  }, [confirmDelete, removeStory, editingStoryId]);

  const isEmpty = blocks.length === 0;
  const isEdit = mode === 'edit';
  const tileTap = isEdit ? toggleWeight : recolor;

  const headerName =
    editingStoryName ?? defaultStoryName(stories.length);
  const namingDefault = headerName;

  return (
    <main className="mx-auto w-full max-w-screen-sm px-4 pt-6 pb-12">
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handlePicked}
      />
      <h1 className="mb-3 truncate font-serif text-2xl text-ink/80">
        {headerName}
      </h1>
      {isEmpty ? (
        <EmptyCanvas onTap={addColor} />
      ) : (
        <Tile
          blocks={blocks}
          mode={mode}
          onSwatchTap={tileTap}
          onSwatchRemove={removeBlock}
          onLongPress={enterEdit}
          onReorder={onReorder}
        />
      )}
      {!isEdit && (
        <ActionRow
          onAdd={isEmpty ? undefined : addColor}
          onShuffle={shuffleColor}
          onDiscard={isEmpty ? undefined : discard}
          onSave={isEmpty ? undefined : openNaming}
          canAdd={!isAtMax}
          canShuffle={!isAtMax}
          canSave={canSave}
        />
      )}
      {isEdit && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onPointerUp={exitEdit}
            aria-label="Exit edit mode"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-elevated text-ink shadow-md ring-1 ring-rule/60 [touch-action:manipulation]"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      )}
      <SavedStories
        stories={stories}
        onTap={copyStory}
        onEdit={editStory}
        onDelete={askDeleteStory}
      />
      {namingOpen && (
        <NamingOverlay
          defaultName={namingDefault}
          onCancel={cancelNaming}
          onConfirm={confirmNaming}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.name}"?`}
          onConfirm={performDelete}
          onCancel={cancelDelete}
        />
      )}
    </main>
  );
}

function EmptyCanvas({ onTap }: { onTap: () => void }) {
  const style: CSSProperties = {
    borderRadius: '12px',
    filter: TILE_SHADOW,
  };
  return (
    <section
      onPointerUp={onTap}
      style={style}
      className="flex aspect-[3/2] w-full select-none items-center justify-center bg-paper-elevated [touch-action:manipulation]"
    >
      <Plus className="h-14 w-14 text-ink/40" strokeWidth={1.25} />
    </section>
  );
}
