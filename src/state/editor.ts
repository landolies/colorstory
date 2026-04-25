import type { ColorBlock } from '../lib/types';

export type Mode = 'view' | 'edit';

export interface EditorState {
  mode: Mode;
  blocks: ColorBlock[];
}

export type EditorAction =
  | { type: 'addBlock'; block: ColorBlock }
  | { type: 'recolorBlock'; id: string; hex: string }
  | { type: 'removeBlock'; id: string }
  | { type: 'toggleWeight'; id: string }
  | { type: 'reorderBlocks'; ids: string[] }
  | { type: 'enterEdit' }
  | { type: 'exitEdit' }
  | { type: 'discardAll' };

export const MAX_COLORS = 5;
export const MIN_COLORS_TO_SAVE = 2;

export const initialEditorState: EditorState = {
  mode: 'view',
  blocks: [],
};

function hasAdjacentDuplicates(blocks: ColorBlock[]): boolean {
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].hex === blocks[i - 1].hex) return true;
  }
  return false;
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case 'addBlock': {
      if (state.blocks.length >= MAX_COLORS) return state;
      const last = state.blocks[state.blocks.length - 1];
      if (last && last.hex === action.block.hex) return state;
      return { ...state, blocks: [...state.blocks, action.block] };
    }
    case 'recolorBlock': {
      const idx = state.blocks.findIndex((b) => b.id === action.id);
      if (idx === -1) return state;
      const prev = state.blocks[idx - 1];
      const next = state.blocks[idx + 1];
      if (
        (prev && prev.hex === action.hex) ||
        (next && next.hex === action.hex)
      ) {
        return state;
      }
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.id ? { ...b, hex: action.hex } : b,
        ),
      };
    }
    case 'removeBlock': {
      const next = state.blocks.filter((b) => b.id !== action.id);
      if (next.length === 0) return { mode: 'view', blocks: [] };
      return { ...state, blocks: next };
    }
    case 'toggleWeight':
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.id
            ? { ...b, weight: b.weight === 'major' ? 'minor' : 'major' }
            : b,
        ),
      };
    case 'reorderBlocks': {
      const map = new Map(state.blocks.map((b) => [b.id, b]));
      const next = action.ids
        .map((id) => map.get(id))
        .filter((b): b is ColorBlock => b !== undefined);
      if (hasAdjacentDuplicates(next)) return state;
      return { ...state, blocks: next };
    }
    case 'enterEdit':
      if (state.blocks.length === 0) return state;
      return { ...state, mode: 'edit' };
    case 'exitEdit':
      return { ...state, mode: 'view' };
    case 'discardAll':
      return { mode: 'view', blocks: [] };
  }
}
