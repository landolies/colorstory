import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { Plus } from 'lucide-react';

export function Index() {
  const [color, setColor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onPicked = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setColor(event.target.value.toLowerCase());
  }, []);

  return (
    <main className="mx-auto w-full max-w-screen-sm px-4 pt-6">
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={onPicked}
      />
      <section
        onPointerUp={openPicker}
        className="aspect-[3/2] w-full select-none overflow-hidden rounded-sm bg-paper-elevated ring-1 ring-rule/60 [touch-action:manipulation]"
        style={color ? { backgroundColor: color } : undefined}
      >
        {!color && (
          <div className="flex h-full items-center justify-center">
            <Plus
              className="h-14 w-14 text-ink/40"
              strokeWidth={1.25}
            />
          </div>
        )}
      </section>
    </main>
  );
}
