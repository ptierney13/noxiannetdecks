# Reference Docs

Use this folder for evergreen reference material that explains how the system
works.

Reference docs are not implementation plans. They should describe current
policy, source-of-truth behavior, and durable constraints.

Both flat files and topic subfolders are valid here.

- use a flat file when one document is enough
- use a subfolder with its own `README.md` when a reference area has multiple
  closely related architecture surfaces

## Contents

One level down, the current reference surface is:

- [initiative-doc-authoring.md](./initiative-doc-authoring.md):
  compact reference for structuring active initiative docs in `docs/work/`
- [ui/README.md](./ui/README.md):
  UI design system, token inventory, component patterns, and anti-patterns for
  frontend implementation
- [cloudflare-deployment/README.md](./cloudflare-deployment/README.md):
  Cloudflare-hosted production architecture, with subdocs for the deployed app,
  API, card data, price pipeline, and published price contract

## Required Sections

Every reference doc in this folder or its subfolders should include an
`Update Triggers` section.

That section should list a compact, precise set of conditions that require the
document to be updated.

## Update Triggers

Update this README when:

- a new top-level reference doc or reference subfolder is added
- a reference topic is renamed, removed, or moved
- the required structure for reference docs changes
