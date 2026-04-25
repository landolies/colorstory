# Lessons

Project-specific learnings — mistakes, surprises, and "don't do this again" notes from working on Color Story. Primarily for Claude Code's reference when picking the project back up, but useful for any human contributor too.

Format: one entry per lesson, dated, with **what happened**, **why**, and **what to do instead**.

---

## 2026-04-24 — Don't write placeholder files when intending to save a memory

**What happened.** When asked to save a feedback memory about iteration cadence, Claude wrote a file `.claude/skip` containing the literal text `placeholder` to the project directory. The file had no purpose and was discovered by the user, who reasonably asked what it was for. Claude removed it and apologized.

**Why.** A confused intermediate step. The intended action was a `Write` to the memory directory at `~/.claude/projects/-Users-tosten-projects-colorstory/memory/feedback_iteration_cadence.md`. Instead, a `Write` ran with the wrong path (under the project's `.claude/`) and stub content. Likely the model emitted the placeholder as scaffolding while assembling the actual memory content, and the harness executed it before the real call.

**Lesson.**
- Memory files always live at `~/.claude/projects/<encoded-path>/memory/<descriptive-name>.md`. The repo's `.claude/` directory is for project-local Claude Code config (and now this lessons file), **not** for memory.
- Never run a `Write` with placeholder content. If the content isn't ready, don't issue the call. There is no value in "draft" files in the working tree; they're just confusing artifacts that survive past the moment of confusion.
- Pre-flight check before every `Write` to a non-source file: is the path right, and is the content meaningful as written?
