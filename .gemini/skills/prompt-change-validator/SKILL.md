---
name: prompt-change-validator
description: Validate system prompt edits by detecting changed prompt-related files, identifying relevant behavioral evals, running those evals, and reporting pass/fail deltas between a base revision and the current workspace.
---

# Prompt Change Validator

Use this skill when a contributor edits prompt files and wants fast,
targeted behavioral validation.

## Workflow

1. Detect prompt-related changes.
   - Inspect changed files in the working tree and staged diff.
   - Focus on prompt-bearing paths (for example `packages/core/src/prompts/`,
     `packages/core/src/core/prompts.ts`, and related prompt utilities).
2. Identify relevant evals.
   - Collect all files in `evals/*.eval.ts`.
   - Score relevance using filename keywords and content overlap with changed
     prompt topics (for example shell, plan mode, tool safety, delegation).
   - Keep a focused subset; include more files only when confidence is low.
3. Build and bundle in both revisions.
   - Base revision: merge-base against main when available.
   - Current revision: local workspace state.
   - In each revision run:
     - `npm run build`
     - `npm run bundle`
4. Run the same targeted eval set in each revision.
   - Use:
     - `cross-env RUN_EVALS=1 vitest run --config evals/vitest.config.ts <matched files>`
5. Compare outcomes.
   - Report status changes per test case:
     - pass -> fail (regression)
     - fail -> pass (improvement)
     - unchanged pass/fail
6. Provide a plain-English recommendation.
   - If regressions exist, list the highest-priority failing behavior area and
     suggest the smallest next validation run.

## Fallback Rules

- If main/base cannot be resolved locally, run only current revision and state
  that delta comparison is unavailable.
- If no prompt-related files changed, explain that no targeted prompt validation
  was needed and offer to run a behavior area manually.

## Output Format

1. `Changed prompt files`
2. `Selected eval files (and why)`
3. `Delta summary` (improved/regressed/unchanged counts)
4. `Most important regressions`
5. `Recommended next run`adfs


