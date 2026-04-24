export const haptics = {
  tap(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
  },
  pulse(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
  },
};

export const clipboard = {
  async write(text: string): Promise<{ ok: boolean }> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return { ok: false };
    }
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },
};
