# TODO

Deferred work that doesn't have a date but shouldn't be lost.

---

## DragPreview visual not matching expectation

**Status:** Multiple attempts in slice 3 to make the dragged-block preview "feel plucked from the canvas" did not converge. Code currently in `src/components/Tile.tsx` (the `DragPreview` component) renders the parallelogram with the right dimensions, clip-path, color, drop-shadow, and a lift-in scale animation, and yet the visual is not what the user wants.

**Why it isn't blocking:** the drop-flow logic, swipe-to-remove, reorder validation, etc. all work correctly underneath. Only the visual representation of the floating preview is unsatisfying. Slices 4 (persistence, naming, archive) and 5 (Capacitor APK) do not touch this code or depend on it.

**Why it's worth a fresh angle:** the back-and-forth on this in one conversation accumulated assumptions about clip-path / DragOverlay portaling / scale animation that may have anchored on a wrong root cause. Suggested approaches when revisiting:

- Take screenshots/screen-recordings of the actual on-device behavior and post them. The asymmetry between what's described and what the implementation produces is probably visually obvious — a still frame would unblock the diagnosis fast.
- Try a completely different drag implementation. Options: render the preview INSIDE the Tile (no portal) so `--seam-x` inherits naturally; replace the polygon clip-path with an inline SVG shape; or skip `DragOverlay` and use a manually-positioned absolute element following pointer events.
- /ultrareview the branch — fresh agents seeing the code without conversation history may diagnose differently.

---

## Spec-vs-code drift audit

**Trigger:** when `src/components/Tile.tsx` exists AND a full create-color → save-story → see-it-in-archive flow works end-to-end (gesture model + persistence both wired).

**Action:** schedule a one-time remote agent (via `/schedule`) to read `SPEC.md` and survey `src/`, producing a punch list of:

- (a) spec sections the code has diverged from,
- (b) spec sections that turned out to be impractical or were silently changed during implementation,
- (c) gaps where new behavior was added that isn't in the spec,
- (d) acceptance-checklist items in `SPEC.md` §11 that are failing.

Output should be concrete `file:line` deltas, not a code review. The agent runs read-only (Read, Glob, Grep, Bash).

**Why deferred:** running this against scaffolding-only code produces a noisy report and wastes the run. Wait until the gesture model — the spec-densest, drift-prone area — has actually been built.
