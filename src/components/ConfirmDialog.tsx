import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onConfirm, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
      onPointerUp={onCancel}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-paper-elevated p-6 pb-8 shadow-xl sm:rounded-2xl"
        onPointerUp={(e) => e.stopPropagation()}
      >
        <p className="font-serif text-xl text-ink">{message}</p>
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
              onConfirm();
            }}
            aria-label="Confirm"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-paper text-ink shadow-md ring-1 ring-rule/60 [touch-action:manipulation]"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
