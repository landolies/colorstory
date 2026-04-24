# Color Story

A mobile-first Android app for capturing color combinations from the real world. Pick colors with the system color picker, weight and order them deliberately, name the combination, and archive it locally.

> **Looking for behavioral details?** See [`SPEC.md`](./SPEC.md). This README covers setup, orientation, and how to collaborate with Claude Code on this codebase.

---

## Quick start

```bash
# clone / open the project folder, then
npm install
npm run dev
```

The dev server prints a local URL (typically `http://localhost:5173`). Open it in Chrome on Android, or use Chrome DevTools device emulation (Pixel 5, portrait, touch enabled) — that's the target form factor.

### Building the APK

```bash
npm run build              # web build → dist/
npx cap sync android       # copy build into the Android project
npx cap open android       # opens Android Studio for signing/run
```

First-time setup: `npx cap add android` after `npm install`. You'll need Android Studio with the SDK and a recent JDK on your `PATH`.

### Scripts

| Command             | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Vite dev server with HMR                   |
| `npm run build`     | Production build to `dist/`                |
| `npm run preview`   | Serve the production build locally         |
| `npm run lint`      | Lint with the project's ESLint config      |
| `npm run typecheck` | TypeScript type-check without emitting     |
| `npm run test`      | Vitest unit + component tests              |
| `npm run test:e2e`  | Playwright gesture suite (Android emulation) |

---

## Tech stack at a glance

- **React 18 + Vite 5 + TypeScript 5**
- **Tailwind CSS v3** with a custom HSL semantic token system
- **Capacitor 6** for the Android APK shell (haptics, clipboard, back button, status bar)
- **@dnd-kit** for drag-and-drop in edit mode
- **sonner** for toasts, **lucide-react** for icons
- **Self-hosted fonts** (Fraunces, Inter, JetBrains Mono) in `public/fonts/`
- **No backend.** Data lives in `localStorage`. IDs come from `crypto.randomUUID()`.

No shadcn/ui, no UI primitive library beyond `sonner`. UI is hand-rolled against the design tokens.

Full rationale and version pins live in `SPEC.md` §2 and `package.json`.

---

## Project layout

```
src/
├── pages/
│   └── Index.tsx            # The single screen
├── components/
│   ├── Tile.tsx             # Mitered tile, mode state, long-press timer
│   ├── Swatch.tsx           # One color block (clip-path seam, edit overlays)
│   ├── SavedStories.tsx     # Archive grid
│   ├── NamingOverlay.tsx    # Bottom-sheet naming modal
│   └── ActionRow.tsx        # × discard, ✓ save buttons
├── lib/
│   ├── color.ts             # HSL random + readable-text-over-hex
│   ├── storage.ts           # The only module that touches localStorage
│   └── platform.ts          # Capacitor-aware haptics + clipboard
├── state/
│   └── editor.ts            # useReducer for editor state
└── index.css                # Tokens, typography, keyframes, @font-face

android/                     # Capacitor-generated Android project (committed)
public/fonts/                # Self-hosted .woff2 files
tests/                       # Vitest + Playwright suites
```

---

## Working with Claude Code on this project

This repo has a single authoritative reference: **`SPEC.md`**. When asking Claude Code to make changes, the most useful pattern is:

1. **Point at the spec section.** e.g. "Implement §5 (gesture model) in `Tile.tsx`."
2. **Ask Claude Code to read the spec first** if it seems to be improvising. A short prompt like "Before editing, re-read `SPEC.md` §3 for the visual language" is usually enough.
3. **When behavior is underspecified,** either (a) update `SPEC.md` first and then ask for the change, or (b) ask Claude Code to propose spec language, review it, then implement. Avoid making decisions only in code — the spec is the one place that survives.

### Prompts that tend to work well

- "Implement the empty-state canvas per `SPEC.md` §4.2. Use existing tokens from `src/index.css`; no raw color literals."
- "The long-press-into-edit-mode flow in `Tile.tsx` is misfiring on scroll. Check §5 and propose a fix before editing."
- "Add a new color source (paste hex). Follow the extensibility pattern in §9 — peer to `randomPleasantColor`, not a change to `Index.tsx`."
- "Add a haptics call here — go through `src/lib/platform.ts`, not `@capacitor/haptics` directly."

### Prompts to avoid

- "Make it look nicer." The spec is deliberately specific about the visual language; vague asks produce drift. Name the section you want changed and propose the change in spec terms first.
- "Add dark mode / tags / search / export." These are out of scope for v0 (see `SPEC.md` §1 non-goals). If you want one, promote it into the spec first.

### Before you accept a change

Run through the acceptance checklist in `SPEC.md` §11. It's short and it catches the things that regress most often: gesture collisions, layout shift on details toggle, raw color literals, and components importing `@capacitor/*` directly instead of going through `src/lib/platform.ts`.

---

## Design principles (short form)

These are summarized from `SPEC.md` §1 so you don't have to open another tab to remember them:

1. **Capture speed over everything.** No modal is worth another tap.
2. **Fidelity, not approximation.** System color picker; no sliders.
3. **Order and weight are meaning.** The data model and the render must both preserve them.
4. **Quiet UI.** If you're about to add a label, try removing one first.
5. **On-device only (v0).** No accounts, no cloud, no network after load.

---

## Known limitations (v0)

- No image eyedropper (planned for v1)
- No cloud sync, accounts, sharing, or export beyond clipboard
- No tagging, search, or sorting in the archive
- No undo/redo in the editor
- Android only — iOS is not supported and not tested

---

## Browser & device support

- **Primary target:** Android 10+ in the Capacitor WebView (system Chromium-based).
- **Also runs in:** Chrome on Android (for development and quick sharing).
- Requires `crypto.randomUUID`, `<input type="color">`, and the Capacitor APIs listed in `SPEC.md` §2. All available on the target.
- Desktop browsers will run the dev server but gestures (long-press, drag) are awkward with a mouse and aren't a supported surface.
