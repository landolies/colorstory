import { useCallback, useEffect, useRef, useState } from 'react';
import type { SavedStory } from '../lib/types';
import { loadStories, saveStories } from '../lib/storage';

interface UseArchiveResult {
  stories: SavedStory[];
  addStory: (story: SavedStory) => void;
  updateStory: (id: string, partial: Partial<Omit<SavedStory, 'id'>>) => void;
  removeStory: (id: string) => void;
}

export function useArchive(onError?: () => void): UseArchiveResult {
  const [stories, setStories] = useState<SavedStory[]>(() => loadStories());
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const isFirstWrite = useRef(true);

  useEffect(() => {
    if (isFirstWrite.current) {
      isFirstWrite.current = false;
      return;
    }
    const result = saveStories(stories);
    if (!result.ok) onErrorRef.current?.();
  }, [stories]);

  const addStory = useCallback((story: SavedStory) => {
    setStories((prev) => [...prev, story]);
  }, []);

  const updateStory = useCallback(
    (id: string, partial: Partial<Omit<SavedStory, 'id'>>) => {
      setStories((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...partial } : s)),
      );
    },
    [],
  );

  const removeStory = useCallback((id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { stories, addStory, updateStory, removeStory };
}
