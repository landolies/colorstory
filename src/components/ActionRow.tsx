import { Check, Plus, Shuffle, X, type LucideIcon } from 'lucide-react';
import { type PointerEvent as ReactPointerEvent } from 'react';

interface ActionRowProps {
  onAdd?: () => void;
  onShuffle: () => void;
  onDiscard?: () => void;
  onSave?: () => void;
  canAdd?: boolean;
  canShuffle?: boolean;
  canSave?: boolean;
}

interface PillButtonProps {
  onTap: () => void;
  ariaLabel: string;
  Icon: LucideIcon;
  disabled?: boolean;
}

function PillButton({ onTap, ariaLabel, Icon, disabled }: PillButtonProps) {
  return (
    <button
      type="button"
      onPointerUp={(e: ReactPointerEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (disabled) return;
        onTap();
      }}
      aria-label={ariaLabel}
      disabled={disabled}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-elevated text-ink shadow-md ring-1 ring-rule/60 disabled:opacity-30 [touch-action:manipulation]"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export function ActionRow({
  onAdd,
  onShuffle,
  onDiscard,
  onSave,
  canAdd = true,
  canShuffle = true,
  canSave = true,
}: ActionRowProps) {
  return (
    <div className="mt-6 flex justify-center gap-3">
      {onAdd && (
        <PillButton
          onTap={onAdd}
          ariaLabel="Add color"
          Icon={Plus}
          disabled={!canAdd}
        />
      )}
      <PillButton
        onTap={onShuffle}
        ariaLabel="Add random color"
        Icon={Shuffle}
        disabled={!canShuffle}
      />
      {onDiscard && (
        <PillButton onTap={onDiscard} ariaLabel="Discard" Icon={X} />
      )}
      {onSave && (
        <PillButton
          onTap={onSave}
          ariaLabel="Save"
          Icon={Check}
          disabled={!canSave}
        />
      )}
    </div>
  );
}
