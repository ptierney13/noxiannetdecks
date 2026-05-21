---
name: session-self-reflection
description: Analyze the current conversation and any docs or files edited during it for durable guidance that should be tracked, documented, or reviewed. Use when the user asks to self reflect on a session, analyze a planning or implementation thread, extract recurring rules or preferences, identify what should become documentation, or summarize repeated corrections and clarifications likely to recur.
---

# Session Self Reflection

Use this skill to turn a conversation into a structured review of what was
learned, clarified, corrected, or stabilized.

## Trigger This Skill When

- The user asks to "self reflect" on the current session.
- The user asks what patterns from a planning or implementation thread should
  become durable guidance.
- The user asks what should be added to docs based on the session.
- The user asks for recurring corrections, preferences, or workflow rules that
  came up during the thread.
- The user wants a review pass before deciding what to codify into repo or
  frontend guidance.

## Workflow

1. Review the current conversation, focusing on:
   - hard rules
   - explicit user preferences likely to recur
   - repeated corrections or clarifications
   - naming, boundary, ownership, responsive-layout, state-ownership, and
     process decisions likely to recur
2. Review any docs or files edited during the session if they help distinguish:
   - what is documented but still insufficient
   - what is not documented anywhere
   - what is already documented well only when the user explicitly asks for
     that confirmation
3. Prefer the final settled version of a decision when the conversation
   contains revisions. Do not promote superseded intermediate proposals as
   durable guidance.
4. When a discussion mixes feature-specific specs with reusable
   architecture/process guidance, extract only the reusable rule unless the
   feature-specific detail clearly generalizes.
5. Prefer frontend-wide scope over repo-wide scope when the pattern is really
   about frontend architecture, responsive behavior, Storybook, component
   boundaries, state ownership, or UI migration.
6. Prefer unifying overlapping items into one clearer rule rather than listing
   near-duplicates.
7. Stop at analysis unless the user explicitly asks for doc updates.

## Guardrails

- Be conservative about what belongs in durable docs.
- Do not treat one-off product/content choices as reusable guidance unless the
  user clearly generalized them.
- Do not overweight active-plan details when an evergreen doc already gives the
  durable rule.
- If a decision changed during the session, use the final settled version only.

## Recommended Output Pattern

When the user asks for a structured review, default to two titled tables:

1. `Addressed But Insufficient`
2. `Not Addressed Anywhere`

Only include a `Properly Documented` table when the user explicitly asks for
confirmation of what is already covered well.

Recommended columns:

- `Scope` (`repo-wide` or `frontend-wide`)
- `Pattern / rule likely to recur`
- `Why it matters` or `Why it likely needs documentation`
- `Where it’s documented today` when relevant
- `What’s insufficient` when relevant

## Recommended Prompt Pattern

If the user wants a reusable prompt for this workflow, adapt this:

```text
Analyze the current conversation and any docs/files edited during it for
patterns that should become durable guidance.

Scope:
- Treat durable guidance as either repo-wide or frontend-wide.
- Stop at the point of producing review tables; do not edit docs yet.
- Focus on things I explicitly corrected, clarified, or expressed as strong
  preferences, plus hard rules implied by repo process.

What to extract:
- hard rules
- specific preferences I expressed
- repeated corrections/clarifications I had to make
- naming, boundary, ownership, responsive-layout, state-ownership, and process
  patterns likely to recur

Exclude:
- one-off product/content decisions
- temporary implementation details unlikely to generalize
- superseded intermediate proposals when a later final decision replaced them

Important interpretation rules:
- Prefer the final settled version of a decision when the conversation contains
  revisions.
- When a discussion mixes feature-specific specs with reusable
  architecture/process guidance, extract only the reusable rule unless the
  feature-specific detail clearly generalizes.
- Prefer unifying overlapping items into one clearer rule rather than listing
  near-duplicates.

Default output:
- `Addressed But Insufficient`
- `Not Addressed Anywhere`

Only include `Properly Documented` if I explicitly ask for it.
```
