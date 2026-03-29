---
name: eval-scaffolder
description: Create a new behavioral eval stub from a plain-English behavior description by choosing the right eval filename/location, generating the standard Gemini CLI eval structure, and pre-filling imports, test scaffolding, and placeholder assertions.
---

# Eval Scaffolder

Use this skill when a contributor describes behavior to test and wants a
ready-to-edit eval file stub.

## Workflow

1. Convert behavior description into a concise eval name.
   - File path: `evals/<behavior-name>.eval.ts`
   - Use lowercase kebab-case.
2. Check for existing nearby evals with similar behavior to align naming and
   assertion style.
3. Generate a complete stub with:
   - Required header comment
   - `vitest` imports (`describe`, `expect`)
   - `evalTest` import from `./test-helper.js`
   - `FILES` fixture object (small realistic workspace)
   - `describe(...)` block
   - One starter `evalTest('USUALLY_PASSES', {...})`
   - Placeholder assertion using `rig.readToolLogs()`, `rig.readFile(...)`, or
     both
4. Default all new tests to `USUALLY_PASSES`.
5. Add concise TODO comments where contributor-specific logic is needed.
6. Return a short explanation of what still needs to be filled in.

## Stub Template

Use this baseline shape and adapt names/fixtures to the requested behavior:

```typescript
/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect } from 'vitest';
import { evalTest } from './test-helper.js';

const FILES = {
  'README.md': '# Test fixture\n',
  'src/index.ts': 'export const value = 1;\n',
} as const;

describe('<behavior_name>', () => {
  // New evals start as USUALLY_PASSES.
  evalTest('USUALLY_PASSES', {
    name: 'should <expected behavior>',
    prompt: '<user prompt that triggers behavior>',
    files: FILES,
    assert: async (rig, result) => {
      const logs = rig.readToolLogs();
      // TODO: add specific tool-call assertions.
      expect(logs.length).toBeGreaterThanOrEqual(0);

      const content = rig.readFile('src/index.ts');
      // TODO: replace with behavior-specific assertion.
      expect(content).toContain('value');
    },
  });
});
```

## Guardrails

- Never place new eval files outside `evals/`.
- Never start new evals as `ALWAYS_PASSES`.
- Prefer one high-quality eval case over many weak placeholders.
