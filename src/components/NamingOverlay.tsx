import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Check, X } from 'lucide-react';

interface NamingOverlayProps {
  defaultName: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}

export function NamingOverlay({
  defaultName,
  onCancel,
  onConfirm,
}: NamingOverlayProps) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleConfirm = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    onConfirm(trimmed);
  }, [name, onConfirm]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
      onPointerUp={onCancel}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-paper-elevated p-6 pb-8 shadow-xl sm:rounded-2xl"
        onPointerUp={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border-b border-rule/60 bg-transparent pb-2 font-serif text-2xl text-ink outline-none"
          aria-label="Story name"
        />
        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            onPointerUp={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            aria-label="Cancel"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-paper text-ink shadow-md ring-1 ring-rule/60 [touch-action:manipulation]"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onPointerUp={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            aria-label="Save"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-paper text-ink shadow-md ring-1 ring-rule/60 disabled:opacity-30 [touch-action:manipulation]"
            disabled={name.trim().length === 0}
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
