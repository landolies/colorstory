import { Check, X } from 'lucide-react';

interface ActionRowProps {
  canSave: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function ActionRow({ canSave, onDiscard, onSave }: ActionRowProps) {
  return (
    <div className="mt-6 flex justify-center gap-4">
      <button
        type="button"
        onPointerUp={onDiscard}
        aria-label="Discard"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-elevated text-ink shadow-md ring-1 ring-rule/60 [touch-action:manipulation]"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        type="button"
        onPointerUp={canSave ? onSave : undefined}
        disabled={!canSave}
        aria-label="Save"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-elevated text-ink shadow-md ring-1 ring-rule/60 disabled:opacity-30 [touch-action:manipulation]"
      >
        <Check className="h-5 w-5" />
      </button>
    </div>
  );
}
