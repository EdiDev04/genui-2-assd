import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const p = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--no-coverage', '--reporter=verbose'], {
  stdio: 'pipe',
  cwd: process.cwd()
});

let out = '';
let err = '';
p.stdout.on('data', d => { out += d.toString(); process.stdout.write(d); });
p.stderr.on('data', d => { err += d.toString(); process.stderr.write(d); });
p.on('close', (code) => {
  writeFileSync('/tmp/test-results.txt', `=== STDOUT ===\n${out}\n=== STDERR ===\n${err}\n=== EXIT: ${code}\n`);
  process.exit(code);
});
