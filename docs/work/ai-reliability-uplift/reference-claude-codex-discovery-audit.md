# Claude / Codex Discovery Audit - 2026-05-20

Findings from a live session audit comparing how Claude Code and Codex each
build context from this repo's documentation. Read this before finalizing Stage
1 (per-package guidance) and Stage 3 (custom skills), because both stages
depend on these discovery rules.

---

## How Claude loads context

Claude Code's session startup loads exactly two things automatically:

1. `CLAUDE.md` at the project root
2. the user's persistent memory index under `~/.claude/projects/.../MEMORY.md`

Everything else is reactive. Claude reads files only when a task requires them
or when another doc explicitly points to them.

Codex, by contrast, reads `AGENTS.md` eagerly at session start and treats it as
its primary guidance surface.

This asymmetry means:

- instructions that exist only in `AGENTS.md` are invisible to Claude on a cold
  start
- instructions that exist only in `CLAUDE.md` or Claude memory are invisible to
  Codex

---

## Gaps found

### G1: Root `AGENTS.md` is not auto-loaded by Claude

The start-of-work flow, worktree sync rule, and some plan-shape detail lived in
root `AGENTS.md` but not in `CLAUDE.md`. Claude would only read `AGENTS.md` if
directed mid-task, which meant it could branch from the wrong base or skip the
worktree sync.

**Fix (Stage 1):** Add one line to `CLAUDE.md`:

```md
Read `AGENTS.md` at the start of every session before doing any work.
```

### G2: Repo-local skills were not discoverable

`.agents/skills/noxiannet-preview-url/SKILL.md` existed and was useful, but
there was no mention of repo-local skills in any auto-loaded file. An agent
that had not encountered the skill before could recompute preview URLs from
scratch and miss the "derived, not proven live" caveat captured in the skill.

**Fix (Stage 1):** Add a pointer in `CLAUDE.md` or root `AGENTS.md`:

```md
Repo-local skills live in `.agents/skills/` - invoke them via the Skill tool
rather than improvising the same procedure from scratch.
```

### G3: Skill location and invocation model needed one convention

During the audit, the repo had drift between historical `skills/` usage and the
planned `.agents/skills/` structure.

If that had continued into Stage 3, the repo would have ended up with parallel
skill conventions that agents would have to guess between.

**Fix (before Stage 3):** Standardize on `.agents/skills/<skill-slug>/SKILL.md`
and the Skill tool invocation model.

### G4: Important `docs/` material was not discoverable

`docs/reference/cloudflare-deployment/README.md` is now the top-level reference
for the Cloudflare deployment architecture. The
`price_store/src/sources/*/README.md` and `analysis.md` files document field
mappings and rate-limit behavior for the price scrapers. Without pointers from
auto-loaded docs, an agent doing Cloudflare or price-store work had to find
them by manual inspection or not at all.

**Fix (Stage 1 or workspace AGENTS pass):**

- `price_store/AGENTS.md` should point to `price_store/src/sources/*/README.md`
  in its routing table
- the Cloudflare deployment reference should be reachable from the skill and
  root guidance

`.agents/skills/noxiannet-preview-url/SKILL.md` now references the Cloudflare
deployment reference, so that doc is reachable once the skill is discoverable.

### G5: `.claude/worktrees/` contains stale `AGENTS.md` snapshots

`.claude/worktrees/` contains many older Claude worktree snapshots, each with
its own copy of `AGENTS.md` and sometimes `frontend/AGENTS.md`. They are not
auto-loaded, but broad file search can surface them alongside the live copies
and an agent may accidentally treat them as authoritative.

**Fix:** No immediate product change required, but agent-facing search guidance
should tell agents to ignore `.claude/worktrees/`.

---

## Summary Of Fixes By Stage

| Finding | Fix | Stage |
| --- | --- | --- |
| G1: Root `AGENTS.md` not auto-loaded | One line in `CLAUDE.md` | Stage 1 |
| G2: Repo-local skills not discoverable | One line in `CLAUDE.md` or root `AGENTS.md` | Stage 1 |
| G3: Skill location/invocation convention unresolved | Standardize before writing more skills | Before Stage 3 |
| G4: `docs/` and source READMEs not discoverable | Add task-routing pointers and skill reachability | Stage 1 |
| G5: Stale worktree `AGENTS.md` copies | Exclude from search and treat as non-authoritative | No action required now |
