#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function run(command, label) {
  process.stdout.write(`→ ${label}...`);
  try {
    execSync(command, { stdio: 'pipe', cwd: root });
    process.stdout.write(' ✓\n');
  } catch (e) {
    process.stdout.write(' ✗\n');
    process.stderr.write(e.stdout?.toString() ?? '');
    process.stderr.write(e.stderr?.toString() ?? '');
    process.exit(1);
  }
}

run('npm run clean', 'clean');
run('npm ci --quiet --no-audit --no-fund', 'install');
run('npm run format --log-level silent', 'format');
run('npm run build', 'build');
run('npm run lint:ci', 'lint');
run('npm run typecheck', 'typecheck');
run('npm run test:ci', 'test');

process.stdout.write('\n✅ Preflight passed!\n');
