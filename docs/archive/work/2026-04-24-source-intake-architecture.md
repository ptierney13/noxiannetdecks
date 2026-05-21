# Source Intake Architecture

> Status: completed

## Summary

Define the long-term organization for public-source intake before additional
source collectors are implemented. The intake flow should isolate source logic
per public source, require a written analysis before any pull code is added,
normalize source outputs into one shared event input format, and process that
shared format into canonical storage through a separate pipeline layer.

## Key Changes

- Add a documented intake architecture centered on:
  - source-specific folders
  - a shared event input format
  - a separate shared-format-to-storage processing layer
- Require each public source folder to contain:
  - `analysis.md`
  - `README.md`
  - `pull/` tools
  - `transform/` tools
- Require `analysis.md` to be written first and approved before any source pull
  code is implemented for that source.
- Keep raw collection text-only and aligned with the green-source policy.
- Keep source-specific transformation logic separate from canonical storage
  processing so provenance and review state remain consistent.

## Test Plan

- Review the documented folder structure against the Stage 1 source policy.
- Confirm every future source implementation can follow the sequence:
  - analyze
  - approve
  - pull
  - transform to shared event input
  - process into canonical storage
- Confirm the documented architecture prevents source folders from writing
  directly to canonical storage.

## Assumptions

- This plan documents architecture only; it does not approve implementation for
  any new public source by itself.
- Every source still needs its own source-specific analysis and approval.
- The shared event input format is the contract boundary between source intake
  and canonical storage.
- Existing temporary pilot data is disposable and should not define the final
  intake architecture.
