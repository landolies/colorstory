# Color Story — Specification

> This document is the source of truth for **what** Color Story does and **how** it behaves. Treat it as authoritative when implementing or modifying features. The `README.md` covers setup and orientation; this file covers behavior.

---

## 1. Product summary

**Color Story** is a mobile-first tool for capturing color combinations encountered in the real world. A user notices a palette (a building facade, a magazine spread, a sunset), picks the colors, weights and orders them, names the combination, and archives it locally for later reference.

The product is deliberately minimal — almost wordless. Interaction is gesture-driven, in the spirit of rearranging app icons on a phone home screen.

### Target environment

- **Primary:** Android phone, portrait, ~360–412px viewport.
- **Distribution:** packaged as an Android APK via Capacitor (system WebView). Same codebase also runs in Chrome on Android for development and quick sharing.
- **Not targeted:** iOS. Desktop runs but is not the design target.

Designing against a single platform lets the spec assume Capacitor APIs, the Android system color picker, and `navigator.vibrate` all work — no per-platform branching needed.

### Primary objectives

1. **Capture speed.** From "I see it" to "it's saved" in as few taps as possible. No typing required except an optional name.
2. **Color fidelity.** Use the system color picker (Android's Material picker, surfaced through `<input type="color">` in the WebView). No approximations, no sliders, no preset palettes.
3. **Compositional intent.** Order and weight are part of the data. `blue / red / green` is not the same as `blue / green / red`. A major red with a minor green is not the same as the reverse.
4. **Quiet interface.** Strip labels, titles, and instructions. The colors carry the screen.
5. **Personal archive.** A small, private, browsable library on-device.

### Non-goals (v0)

- No image upload / eyedropper-from-photo
- No cloud sync, accounts, sharing, or export beyond clipboard
- No tagging, search, or sorting of the archive
- No undo/redo in the editor
- No iOS support

---

## 2. Tech stack

| Concern              | Choice                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Framework            | React 19 + Vite 8 + TypeScript 6 (versions tracked in `package.json`)                      |
| Styling              | Tailwind CSS v3 with a custom HSL semantic token system in `src/index.css`                 |
| Component primitives | Hand-rolled. No shadcn/ui. The only third-party UI dep is `sonner` for toasts.             |
| Drag & drop          | `@dnd-kit/core` + `@dnd-kit/sortable` (pointer + touch sensors)                            |
| Toasts               | `sonner`                                                                                   |
| Icons                | `lucide-react`                                                                             |
| Fonts                | Fraunces, Inter, JetBrains Mono — **self-hosted** as `.woff2` in `public/fonts/`           |
| Persistence          | `localStorage`, key `color-stories-v2`                                                     |
| IDs                  | `crypto.randomUUID()` (requires a secure context — APK and `https://` only)                |
| Color picking        | Native `<input type="color">` (Android system Material picker in the WebView)              |
| Clipboard            | `@capacitor/clipboard` in APK; falls back to `navigator.clipboard.writeText` in browser    |
| Haptics              | `@capacitor/haptics` in APK; falls back to `navigator.vibrate` in browser                  |
| Native shell         | Capacitor 6 (`@capacitor/core`, `@capacitor/android`)                                      |
| Testing              | Vitest for pure logic; Playwright with Android device emulation for gesture flows          |

No backend. No auth. No network calls after first load.

### Platform abstraction

All native-bridged APIs live behind `src/lib/platform.ts`. Components import from this module — never directly from `@capacitor/*`. This keeps the same JSX paths usable in both the browser dev server and the APK without `if (Capacitor.isNativePlatform())` scattered through the UI.

Exports (v0): `haptics.tap()`, `haptics.pulse()`, `clipboard.write(text)`. Picker stays as plain `<input type="color">` since the WebView surfaces the system picker for it; if fidelity ever becomes insufficient, replace it with a thin custom Capacitor plugin behind the same module — no UI changes required.

---

## 3. Visual language

### Tokens (HSL, defined in `src/index.css`)

Components must use these semantic tokens — no raw color literals (`#xxxxxx`, `rgb(...)`) anywhere in component code. The one exception is user-supplied swatch colors themselves, which are applied as inline styles.

- `--ink` — deep foreground text
- `--paper` — warm off-white background
- `--paper-elevated` — slightly lifted surface (empty-state canvas, cards)
- `--rule` — hairline borders and seams

### Typography

- **Fraunces** — palette names, naming overlay input
- **Inter** — all other UI
- **JetBrains Mono** — hex codes in details mode

Fonts are loaded from `public/fonts/` via `@font-face` with `font-display: swap`. No Google Fonts CDN — the app should be fully usable offline after first install.

### Texture

Background carries a faint dotted texture over the paper color. Faint, not loud.

### The tile shape

The active color story is a single horizontal tile occupying the upper portion of the viewport at near-full width.

- **Aspect ratio: 3:2** (width:height), with `min-height: 180px` and `max-height: 60vh` as guardrails.
- The four **outer corners** of the tile are **mitered at 45°** — cut, not rounded — for a crafted, badge-like feel.
- When multiple colors are present, the **seams between them are single straight diagonal lines** (no kinks, no chevrons). Think BMW M / Toyota TRD striped-logo aesthetic.
- The first block's left edge and the last block's right edge remain flat against the tile's mitered outer shape.

### Seam geometry

The seam angle is **fixed** — it does **not** depend on block width. Specifically:

- Each seam advances horizontally by `0.25 × tile_height` from bottom to top (≈76° from horizontal, leaning right).
- Blocks of different flex weights produce seams at different horizontal positions but with identical slope.
- Implementation: single outer `clip-path` on the tile for the mitered shell; per-block `clip-path` polygons for the seams. **Do not** use rotated rectangles + `overflow: hidden` — it doesn't survive reorder cleanly.

### Weighting

Each color block has one of exactly two sizes:

- **major** → `flex: 3`
- **minor** → `flex: 1`

This determines its share of the tile's width.

---

## 4. Screens & layout

Single-screen app. One route.

### 4.1 Header

Only one affordance: a single **eye icon** in the top-right. Tapping it toggles **details mode**, which overlays each color's hex code in small JetBrains Mono type on the swatch. That is the entire header. No title, no nav, no menu.

### 4.2 Canvas (the color story)

Occupies the upper portion of the viewport at the 3:2 aspect ratio defined in §3.

**Empty state**

- The entire canvas is the entry point: a large `+` icon centered on an elevated paper surface.
- Tapping it opens the Android color picker, and the chosen color becomes the first block (size: **major**).
- A small floating **shuffle icon** in the lower-right is also active in the empty state — tapping it adds a random pleasant HSL color (see §6.2) as the first major block.

**Populated state (view mode)**

- Renders the mitered, slanted-seam tile described in §3.
- A small floating **`+`** in the upper-right of the canvas adds another color (up to 5 total; defaults to **minor**).
- A small floating **shuffle icon** in the lower-right adds a random pleasant HSL color.
- See §5 for the gesture model.

**Populated state (edit mode)**

- Tile wiggles (keyframes in `src/index.css`).
- Each block shows two small overlay controls (color/contrast aware, see §6.3):
  - A **size toggle** in one corner, switching the block between **major** and **minor**.
  - A **×** in the opposite corner, removing the block. **Hidden when total count == 2** (cannot drop below the minimum from inside edit mode).
- Drag any block horizontally to reorder.
- The floating `+` slot in the upper-right becomes a **`✓`** — tap to exit edit mode.
- The floating shuffle and the action row (§4.3) are **hidden** while in edit mode. To add a color or save, exit first.

### 4.3 Action row

Only renders when at least one color exists **and** the canvas is in view mode. Two icon-only, circular buttons, centered below the canvas:

- **`×`** — discards the current draft (no confirmation).
- **`✓`** — opens the naming overlay. **Disabled unless there are 2+ colors.**

### 4.4 Archive

Only renders if the user has at least one saved story.

- Responsive grid below the canvas: **1 column** on narrow viewports, **2** on medium, **3** on wide.
- Each entry is a miniature version of the same mitered tile (same slant logic, same weights).
- Below each tile: user-given name (Fraunces), color count, creation date.
- **Tap a tile** → copies that story's hex codes (comma-separated) to the clipboard (§6.7). Toast: "Palette copied".
- Small **trash icon** on each entry deletes it (no confirmation in v0).

### 4.5 Naming overlay

Bottom-sheet-style modal (centered as a card on wider screens). Hand-rolled; no shadcn `Dialog`.

- Single serif text input, pre-filled with `Study №NNN` (where `NNN` is a sequence, padded to 3 digits — see §6.4).
- `×` cancel, `✓` confirm.
- **Enter** confirms. **Escape** cancels (browser only — Android back button handled via Capacitor `App.addListener('backButton', ...)` to dismiss without exiting the app).
- On confirm: the story is persisted, the editor clears, the archive updates, a "Saved" toast appears.

---

## 5. Gesture model

Two modes for the canvas: **view mode** (default) and **edit mode**. The same gesture vocabulary is used in both, but with no overlap — every gesture has exactly one meaning at any moment, so there is no tap/double-tap latency anywhere.

### View mode

| Gesture                          | Result                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| **Single tap on a block**        | Opens the system color picker for that block; replaces it in place. |
| **Long press on the tile** (~450ms) | Enters **edit mode**. Haptic pulse fires.                        |

There is no double-tap in view mode. Single-tap fires immediately on pointer-up.

### Edit mode

| Gesture                          | Result                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| **Drag a block horizontally**    | Reorders blocks via `@dnd-kit/sortable`.                            |
| **Tap a block's size toggle**    | Flips that block between **major** and **minor**. Brief haptic tap. |
| **Tap a block's `×`**            | Removes that block (only shown when count > 2).                     |
| **Tap a block's color area**     | Opens the system color picker for that block.                       |
| **Tap the floating `✓`**         | Exits to view mode.                                                 |

### Long-press detection

Long-press lives on the **tile**, not on individual blocks — this avoids the per-target tap/long-press disambiguation that historically caused scroll-vs-reorder collisions.

- Timer starts on `pointerdown` anywhere inside the tile.
- Cancels if pointer moves more than **8px** in any direction (intent was scroll/drag, not press).
- Cancels on `pointerup` before the timer fires (intent was tap).
- Fires haptic pulse and transitions to edit mode at ~450ms.

### dnd-kit sensor configuration

Drag activation only matters in edit mode (view mode never wires the sortable handler). Sensors:

- **Pointer sensor:** activation requires 6px movement.
- **Touch sensor:** activates immediately with 8px tolerance.

These thresholds prevent accidental reorders when the user is just tapping the size toggle or the color area inside a block.

### Touch-action and selection

The tile has `touch-action: none`, `user-select: none`, and `-webkit-touch-callout: none` to prevent the Android long-press selection callout, image-save dialog, and accidental page scroll on the tile area. These are not optional.

---

## 6. Data & logic

### 6.1 Data model

```ts
type ColorId = string; // crypto.randomUUID()
type StoryId = string; // crypto.randomUUID()

type Weight = "major" | "minor";

interface ColorBlock {
  id: ColorId;
  hex: string;      // "#rrggbb", lowercase
  weight: Weight;
}

interface SavedStory {
  id: StoryId;
  schemaVersion: 2;           // bump on breaking changes; see §6.6
  name: string;               // user-entered, non-empty after trim
  colors: ColorBlock[];       // length 2..5, order-significant
  createdAt: string;          // ISO 8601
}
```

### 6.2 Random color generation

Tuned to avoid neon and mud:

- Hue: uniform random in `[0, 360)`
- Saturation: uniform random in `[45, 80]` percent
- Lightness: uniform random in `[38, 70]` percent
- Convert HSL → hex, store lowercase.

### 6.3 Contrast / readable text over swatches

`src/lib/color.ts` computes whether the readable foreground color over a given hex is light or dark (relative luminance, WCAG-style). Used for:

- The hex label in details mode.
- The size toggle and `×` overlays in edit mode.

So that overlay controls stay legible on any swatch.

### 6.4 Default story name

When the naming overlay opens, the input is pre-filled with `Study №NNN` where `NNN` is `saved_stories.length + 1`, left-padded with zeros to at least 3 digits (`001`, `002`, …, `099`, `100`). The user may overwrite it; the final name must be non-empty after trim.

### 6.5 Constraints

- **Minimum colors to save:** 2
- **Maximum colors per story:** 5
- **First color added:** defaults to **major**
- **Subsequent colors added:** default to **minor**
- Attempting to add a 6th color shows a toast "Max 5" and is a no-op.
- The color input element is treated as a black box: Android fires `change` on dismiss with the picked hex. We do not handle the `input` event (which behaves inconsistently in WebViews).

### 6.6 Persistence

- All saved stories are serialized to a JSON array and stored in `localStorage` under the key **`color-stories-v2`**.
- Loaded on app mount via `src/lib/storage.ts`. **No component touches `localStorage` directly.**
- Re-saved on every mutation to the saved-stories list.
- If `localStorage` access throws (quota, disabled), surface a "Couldn't save" toast and continue in-memory; never crash.

**Migration story:** the storage key is versioned. When the schema changes, bump to `color-stories-v3`, write a migration in `src/lib/storage.ts` that reads the old key, transforms, writes the new key, and deletes the old. Each `SavedStory` also carries `schemaVersion` for in-array migrations of mixed-vintage records.

**Future:** when image eyedropper or other features push payload size near the localStorage quota (~5MB on Android WebView), swap `storage.ts` to IndexedDB. The module signature does not change.

### 6.7 Clipboard format

When a saved tile is tapped: write `color1.hex, color2.hex, ...` (comma + space, lowercase, 6-digit hex with leading `#`) via the platform clipboard (§2). Then toast: "Palette copied".

### 6.8 Toasts (copy reference)

| Event                       | Copy             |
| --------------------------- | ---------------- |
| Story saved                 | `Saved`          |
| Attempting a 6th color      | `Max 5`          |
| Archive tile tapped         | `Palette copied` |
| localStorage write failure  | `Couldn't save`  |

Toasts are short on purpose. If you find yourself writing long toast copy, it's a sign the UI needs another affordance instead.

---

## 7. File structure

```
src/
├── pages/
│   └── Index.tsx            # The single screen. Owns editor state (useReducer)
│                            # and the saved-stories list.
├── components/
│   ├── Tile.tsx             # The mitered tile container. Owns the long-press
│   │                        # timer, mode state, dnd context, and clip-path shell.
│   ├── Swatch.tsx           # One color block: sortable wiring, per-block
│   │                        # clip-path seam, color input, hex label,
│   │                        # edit-mode overlays.
│   ├── SavedStories.tsx     # Archive grid. Reuses slant/miter logic at small size.
│   ├── NamingOverlay.tsx    # Bottom-sheet naming modal.
│   └── ActionRow.tsx        # × discard, ✓ save buttons.
├── lib/
│   ├── color.ts             # Random HSL, readable-text-over-hex, hex helpers.
│   ├── storage.ts           # The only module that touches localStorage.
│   │                        # Owns versioning + migration.
│   └── platform.ts          # Capacitor-aware haptics + clipboard.
├── state/
│   └── editor.ts            # useReducer for editor state (colors, mode, picker).
└── index.css                # Design tokens, typography, wiggle keyframes,
                             # @font-face declarations.
```

When adding a new component, prefer colocating it in `src/components/`. Add to `src/lib/` only for pure logic with no JSX. Add to `src/state/` only for shared stateful hooks.

---

## 8. Implementation notes & gotchas

- **Mitered corners + diagonal seams** are best done with a single `clip-path` on the outer tile and per-block `clip-path` polygons for the seams. See §3 seam geometry for the fixed-angle math.
- **First and last block edges** stay flat against the outer mitered shape. Only the **internal** seams are diagonal.
- **Gesture priority** in view mode: long-press (tile) > tap (block). In edit mode: drag (block) > tap (block control). The two modes never share a gesture, so there is no priority race.
- **The long-press timer must cancel on pointer move > 8px**, otherwise a scroll attempt that lands on the tile will trigger edit mode.
- **Details mode** overlays hex codes; it does not change layout. Toggling it must not cause reflow of the tile.
- **Native color picker:** treat it as a black box. Open the `<input type="color">`, receive a hex on `change`, move on. Do not try to skin or replace it.
- **Android back button** in the APK shell pops the naming overlay if open, exits edit mode if active, otherwise allows default behavior. Wired via Capacitor `App.addListener('backButton', ...)` once at app mount.
- **Status bar** in the APK should match `--paper`. Set via `@capacitor/status-bar` at app bootstrap.

---

## 9. Extensibility

Keep these seams clean so future work is additive:

- **Data layer** is `src/lib/storage.ts`. Swap to IndexedDB, a server, or an export/import flow by replacing that module — not by editing `Index.tsx`.
- **Color sources** are functions returning `{ hex: string }`. Currently: `openNativePicker` and `randomPleasantColor`. Additional sources (image eyedropper, paste-hex, camera sample) should be added as peers.
- **Native bridges** all live in `src/lib/platform.ts`. New native APIs (camera, file system) get added there with a browser fallback (or a clear "APK only" guard) before any component imports them.
- **Archive operations** route through a single hook. Components never touch `localStorage` directly.
- **Export surface** is currently "copy comma-separated hex to clipboard." Future exports (JSON, `.ase`, `.sketchpalette`, PNG) should be additional handlers on the same archive entry, not a rewrite.

---

## 10. Testing

Tests live in `tests/` and are the floor, not the ceiling — manual smoke on a real Android device (or APK on a physical phone) is still required before calling a release ready.

### 10.1 Unit (Vitest)

Cover the pure logic in `src/lib/`:

- `color.ts` — `randomPleasantColor` stays in the configured HSL ranges; `readableTextColor` returns the higher-contrast of `--ink` / `--paper` for known fixtures (white, black, mid-gray, brand swatches).
- `storage.ts` — round-trip serialize/deserialize; quota-exceeded path returns the expected error variant; v2→v3 migration preserves data when we get there.

### 10.2 Component (Vitest + Testing Library)

For non-gesture component logic only:

- `NamingOverlay` pre-fills `Study №NNN` correctly given a saved-stories array.
- `ActionRow` disables `✓` when fewer than 2 colors are present.
- `SavedStories` renders the right number of grid items and fires the delete handler.

Do **not** try to unit-test gestures in jsdom — pointer/touch events don't behave realistically there. That's what §10.3 is for.

### 10.3 Gesture / E2E (Playwright)

Run against the dev server with Android device emulation (`devices['Pixel 5']`, which sets `hasTouch: true`, the right viewport, and a mobile UA).

Flows that must stay green:

1. Empty → tap canvas `+` → picker opens → first major block renders.
2. Add 2nd color → ✓ enabled → name → save → archive shows new tile.
3. Long-press tile → wiggle starts → drag a block → order changes → tap ✓ → wiggle stops.
4. Long-press tile → tap a block's size toggle → flex ratio updates.
5. Long-press tile → tap `×` on a block → block removed; `×` disappears when count drops to 2.
6. Try to add 6th color → "Max 5" toast; no block added.
7. Tap an archive tile → clipboard contains the expected `, `-joined hex string.
8. Reload the page → saved stories survive.
9. Toggle details mode → no layout shift in the tile (snapshot the tile bounding box before/after).

Gesture-collision regression suite (one test each):

- A scroll attempt that starts on the tile does not enter edit mode (pointer moves > 8px before the long-press timer).
- A drag attempt that starts on a block in view mode does nothing (drag is wired only in edit mode).
- A tap on a block's size toggle in edit mode does not initiate a drag.

### 10.4 APK smoke (manual, pre-release)

Before each tagged release, run on a physical Android device:

- Picker opens the system Material picker and returns a usable hex.
- Haptics fire on long-press and size toggle.
- Clipboard write succeeds (paste into another app).
- Back button pops naming overlay / exits edit mode / does the right thing on the home screen.
- App launches with no white flash (status bar matches `--paper`).
- Cold offline launch works (no network calls).

Automating the APK target with Detox/Appium is out of scope for v0.

---

## 11. Acceptance checklist

A change is not "done" until:

- [ ] Works in portrait on a ~375px-wide Android viewport.
- [ ] Gestures (tap / long-press / drag / control-tap) do not collide; the §10.3 collision suite still passes.
- [ ] No raw color literals in component code — all colors go through semantic tokens or user data.
- [ ] No layout shift when toggling details mode.
- [ ] Saves persist across a hard reload.
- [ ] Clipboard copy produces the exact format in §6.7.
- [ ] Min 2 / max 5 constraints are enforced in UI and data.
- [ ] No component imports `@capacitor/*` directly — only via `src/lib/platform.ts`.
- [ ] No console errors or React warnings in normal use.
- [ ] If touching native bridges or persistence: §10.4 smoke run on a real device.
