# Skills

Repo-local Codex skills live here. Keep skills concise, reusable, and focused
on workflows the repo performs repeatedly.

## Required Format

Each skill should live in its own folder and expose a `SKILL.md` file.

Use this structure:

1. YAML frontmatter with:
   - `name`
   - `description`
2. H1 title
3. `Trigger This Skill When`
4. `Workflow`
5. optional supporting sections such as `Guardrails`, `References`, or
   `Recommended Response Pattern`

## Trigger Rule

Every skill should include a `Trigger This Skill When` section.

That section should describe the concrete task patterns, user requests, or repo
contexts that mean the skill is applicable.

If those triggers are met, the agent should read the whole skill before
continuing instead of improvising from the section title or the frontmatter
alone.

## Audience

These skills are implemented in Codex skill format, but they should stay clear
enough that Claude or another agent can also read and follow them directly.

Repo-level Codex agent metadata may also live in
[../openai.yaml](./../openai.yaml). Use that file to define the repo-local
agent surface and any default prompt that should steer skill usage.

## Style

- keep skills workflow-oriented, not essay-like
- prefer concrete trigger language over vague topic labels
- route to source-of-truth docs and scripts instead of duplicating them
- keep recurring response patterns inside the skill when they matter
