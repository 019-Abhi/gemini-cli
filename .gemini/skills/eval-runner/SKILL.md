---
name: eval-runner
description: Run Gemini CLI behavioral evals for a specific behavior area (for example shell safety, tool masking, plan mode) by discovering matching eval files, running the correct commands, and summarizing results in plain English.
---

# Eval Runner

Use this skill when a contributor asks to run evals for a behavior area without
knowing file names or commands.

## Workflow

1. Determine the target behavior area from the request.
   - Example intents: shell safety, plan mode, tool output masking, ask-user.
2. Discover matching eval files in `evals/`.
   - First list all eval files.
   - Then search filenames by behavior keywords and close variants.
   - If multiple candidates are plausible, run all of them.
3. Build before eval execution.
   - Run:
     - `npm run build`
     - `npm run bundle`
4. Run only the selected eval files.
   - Use the eval Vitest config and force inclusion of `USUALLY_PASSES` tests.
   - Preferred command pattern:
     - `cross-env RUN_EVALS=1 vitest run --config evals/vitest.config.ts <file1> <file2> ...`
5. If no files are matched confidently, ask one concise clarification question
   and include the top candidate files.
6. Summarize outcomes in plain English.
   - Include: which files ran, pass/fail per file, top failure reason if any,
     and suggested next command.

## Discovery Rules

- Prioritize exact filename matches first.
- Then include hyphen/underscore/word-order variants.
- Keep scope tight to avoid running the entire eval suite unless explicitly
  requested.

## Response Format

Use this structure:

1. `Behavior area`: interpreted target
2. `Matched eval files`: list of files run
3. `Result`: pass/fail summary
4. `If failures`: likely cause and immediate next step
asd
asd
asdasd
as
dasd
sdfgasfg asdadsg asf
asdxzcgv fg sfgtasd
asdfsdgfju
asdasasdasd