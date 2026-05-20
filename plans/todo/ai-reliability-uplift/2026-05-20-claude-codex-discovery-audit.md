# Claude / Codex Discovery Audit — 2026-05-20

Findings from a live session audit comparing how Claude Code and Codex each
build context from this repo's documentation. Read this before finalizing Stage
1 (per-package guidance) and Stage 3 (custom skills) — both stages have work
items that depend on these findings.

---

## How Claude loads context

Claude Code's session startup loads exactly two things automatically:

1. `CLAUDE.md` at the project root (via the harness)
2. The user's persistent memory index at `~/.claude/projects/.../MEMORY.md`

Everything else is reactive — Claude reads files only when a task requires it
or when it is explicitly directed to. In particular, `AGENTS.md` files are NOT
auto-loaded; they are consulted only when `CLAUDE.md` or another file says
"read this before doing X."

Codex reads `AGENTS.md` eagerly at session start and treats it as its primary
guidance document.

This asymmetry means instructions that exist only in `AGENTS.md` are invisible
to Claude on a cold start, and instructions that exist only in `CLAUDE.md` (or
in Claude's memory files) are invisible to Codex.

---

## Gaps found

### G1: Root AGENTS.md is not auto-loaded by Claude

The start-of-work flow (fetch → pull → `checkout -b codex/<task-name>`), the
worktree sync requirement, and some plan format detail live in root `AGENTS.md`
but not in `CLAUDE.md`. Claude only reads `AGENTS.md` if directed mid-task,
which means it can branch off the wrong base or skip the worktree sync.

**Fix (Stage 1):** Add one line to `CLAUDE.md`:
```
Read `AGENTS.md` at the start of every session before doing any work.
```

### G2: The `skills/` directory is not mentioned in any auto-loaded file

`skills/noxiannet-preview-url/SKILL.md` exists and is well-written, but
nothing in `CLAUDE.md` or root `AGENTS.md` mentions that `skills/` exists.
An agent that hasn't encountered it before will compute preview URLs from
scratch rather than invoking the skill, and will miss the "derived not
proven live" caveat the skill captures.

**Fix (Stage 1):** Add a pointer in `CLAUDE.md` (or root `AGENTS.md` if G1
is also fixed):
```
Repo-local skills live in `skills/` — invoke them via the Skill tool rather
than improvising the same procedure from scratch.
```

### G3: `skills/` vs `.agents/skills/` naming is unresolved

The existing skill lives at `skills/noxiannet-preview-url/SKILL.md` and uses
the Skill tool invocation model. The Stage 3 plan proposes creating new skills
under `.agents/skills/<skill-slug>/SKILL.md` (a different directory). The
Stage 3 plan also leaves open whether new skills use the Skill tool or are
plain SKILL.md files read directly.

If Stage 3 implements skills in `.agents/skills/` without resolving this, the
repo will have two parallel skill conventions that agents will have to guess
between.

**Fix (before Stage 3):** Decide before writing any Stage 3 skill whether the
canonical location is `skills/` or `.agents/skills/`, and whether all skills
are Skill-tool-invocable or plain-read. Update the Stage 3 plan accordingly.
The existing `skills/noxiannet-preview-url/` uses the Skill tool model and
should be treated as the reference implementation unless the decision goes the
other way.

### G4: The `docs/` directory is not discoverable

`docs/cloudflare-pages-functions.md` is the source of truth for the
production API surface and Cloudflare routing setup. The two
`price_store/src/sources/*/README.md` and `analysis.md` files document field
mappings and rate-limit behavior for the price scrapers. None of these are
pointed to from any auto-loaded file. An agent doing Cloudflare or price-store
work has to find them by directory inspection or not at all.

**Fix (Stage 1 or as part of the workspace AGENTS.md work):** The
`price_store/AGENTS.md` planned for Stage 1 should include a pointer to
`price_store/src/sources/*/README.md` files in its task routing table. A line
in `docs/cloudflare-pages-functions.md` is already referenced from
`skills/noxiannet-preview-url/SKILL.md`, so the Cloudflare doc is at least
reachable once that skill is discoverable (see G2).

### G5: `.claude/worktrees/` contains stale AGENTS.md copies

The directory `.claude/worktrees/` holds 20+ past Claude worktree sessions,
each with its own copy of `AGENTS.md` (and some with `frontend/AGENTS.md`).
These are snapshots from prior sessions and may reflect outdated rules. They
are not auto-loaded, but an agent doing broad file search (e.g. `find . -name
AGENTS.md`) will surface them alongside the live copies and may accidentally
treat them as authoritative.

**Fix:** No immediate action needed — these are not auto-loaded. However, when
either `AGENTS.md` file is updated as part of Stage 1, be aware that old
worktree copies will silently diverge. The `.claude/worktrees/` path should
be added to `.gitignore` if it isn't already, and any agent-facing search
instructions should note to exclude that directory.

---

## Summary of fixes by stage

| Finding | Fix | Stage |
|---------|-----|-------|
| G1: Root AGENTS.md not auto-loaded | One line in `CLAUDE.md` | Stage 1 |
| G2: `skills/` not discoverable | One line in `CLAUDE.md` or root `AGENTS.md` | Stage 1 |
| G3: `skills/` vs `.agents/skills/` unresolved | Decide before writing any Stage 3 skill | Before Stage 3 |
| G4: `docs/` and source READMEs not discoverable | Pointer in `price_store/AGENTS.md` + G2 fix covers Cloudflare doc | Stage 1 |
| G5: Stale worktree AGENTS.md copies | Exclude path from searches; low priority | No action required now |
