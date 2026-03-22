/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vitest/config';

const quiet = process.env.GEMINI_PREFLIGHT_QUIET === '1';

export default defineConfig({
  test: {
    include: ['sea/**/*.test.js'],
    environment: 'node',
    ...(quiet ? { silent: true, reporters: ['dot'] as const } : {}),
  },
});
