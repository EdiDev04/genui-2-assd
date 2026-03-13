/**
 * Bootstrap script: creates prisma/dev.db and runs ALL migrations in order.
 * Uses Node.js built-in node:sqlite (Node >= 22.5).
 * Run with: node --experimental-sqlite scripts/bootstrap-db.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'prisma', 'dev.db');
const migrationsDir = join(__dirname, '..', 'prisma', 'migrations');

const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Create _prisma_migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id                TEXT    PRIMARY KEY NOT NULL,
    checksum          TEXT    NOT NULL,
    finished_at       NUMERIC,
    migration_name    TEXT    NOT NULL,
    logs              TEXT,
    rolled_back_at    NUMERIC,
    started_at        NUMERIC NOT NULL DEFAULT (strftime('%s','now') * 1000),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
  );
`);

// Get all migration folders sorted
const folders = readdirSync(migrationsDir)
  .filter(f => f !== 'migration_lock.toml' && f.endsWith && readdirSync(join(migrationsDir, f)).includes('migration.sql'))
  .sort();

for (const folder of folders) {
  // Check if already applied
  const already = db.prepare('SELECT id FROM _prisma_migrations WHERE migration_name = ?').get(folder);
  if (already) {
    console.log(`  Skipped (already applied): ${folder}`);
    continue;
  }

  const sqlPath = join(migrationsDir, folder, 'migration.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  try {
    db.exec(sql);
    db.prepare(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (lower(hex(randomblob(16))), '', datetime('now'), ?, NULL, NULL, datetime('now'), 1)
    `).run(folder);
    console.log(`  Applied: ${folder}`);
  } catch (err) {
    console.warn(`  Warning for ${folder}: ${err.message}`);
  }
}

// Verify User table columns
const cols = db.prepare("PRAGMA table_info('User')").all();
console.log('\nUser table columns:', cols.map(c => c.name).join(', '));

const hasTheme = cols.some(c => c.name === 'themePreference');
console.log('themePreference column present:', hasTheme);

db.close();
console.log('\nDatabase bootstrapped at:', dbPath);
console.log('Next step: run `npx prisma generate` to regenerate the Prisma client.');
