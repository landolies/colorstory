# TODO

Deferred work that doesn't have a date but shouldn't be lost.

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
