---
name: failure-explainer
description: Explain behavioral eval failures in plain English by analyzing failure output and eval tool-call logs, identifying where agent behavior diverged from expected assertions, and pointing to the most likely fix direction.
---

# Failure Explainer

Use this skill when an eval fails and the contributor wants a clear explanation
instead of raw logs.

## Inputs

Collect as many of these as available:

- The failing eval output (terminal text)
- The eval file path and test name
- Tool logs under `evals/logs/` (for example `<sanitized_test_name>.log`)
- Activity logs under `evals/logs/` when present

## Workflow

1. Parse the failure signal.
   - Extract failing test name, assertion message, and expected vs actual.
2. Locate and read relevant logs.
   - Find the matching JSON tool log and optional activity log entries.
3. Reconstruct the behavior timeline.
   - Prompt received
   - Tool calls made (and key args)
   - File mutations or command execution side effects
4. Compare observed behavior to assertion intent.
   - Identify the first divergence point (the earliest step where behavior
     stopped matching test expectations).
5. Explain in plain English.
   - What the test expected
   - What the agent did instead
   - Why that caused the assertion to fail
6. Suggest fix direction.
   - Prompt adjustment, tool instruction tweak, or eval assertion update
     (only if assertion is incorrect or too brittle).

## Analysis Heuristics

- Prefer concrete evidence from tool logs over inferred intent.
- Quote the specific tool call or file state that triggered failure.
- Distinguish between:
  - wrong tool choice
  - right tool, wrong arguments
  - missing tool call
  - correct action but assertion too strict

## Output Format

1. `Failure summary` (1-2 sentences)
2. `Expected vs observed behavior`
3. `First divergence point`
4. `Most likely root cause`
5. `Smallest next fix to try`
