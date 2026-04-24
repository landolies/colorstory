import type { SavedStory } from './types';

const STORAGE_KEY = 'color-stories-v2';

export function loadStories(): SavedStory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedStory[]) : [];
  } catch {
    return [];
  }
}

export function saveStories(stories: SavedStory[]): { ok: boolean } {
  if (typeof window === 'undefined') return { ok: false };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
