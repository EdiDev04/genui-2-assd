/**
 * Applies the themePreference migration directly to SQLite.
 * Uses Node.js built-in node:sqlite (requires Node >= 22.5).
 * Run with: node --experimental-sqlite scripts/apply-migration.mjs
 */
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'prisma', 'dev.db');

if (!existsSync(dbPath)) {
  console.error('Database file not found:', dbPath);
  console.log('The SQLite database has not been created yet.');
  console.log('Run the following commands to set it up:');
  console.log('  npx prisma migrate dev');
  console.log('  npx prisma generate');
  process.exit(1);
}

const db = new DatabaseSync(dbPath);

// Check current columns on User table
const cols = db.prepare("PRAGMA table_info('User')").all();
const hasThemePreference = cols.some(c => c.name === 'themePreference');

if (hasThemePreference) {
  console.log('Column themePreference already exists in User table.');
} else {
  db.exec(`ALTER TABLE "User" ADD COLUMN "themePreference" TEXT NOT NULL DEFAULT 'light';`);
  console.log('Column themePreference added to User table.');
}

const migrationName = '20260313180000_add_theme_preference';
const migrationsTableExists = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'"
).get();

if (migrationsTableExists) {
  const existing = db.prepare(
    'SELECT id FROM _prisma_migrations WHERE migration_name = ?'
  ).get(migrationName);

  if (!existing) {
    db.prepare(`
      INSERT INTO _prisma_migrations
        (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES
        (lower(hex(randomblob(16))), '', datetime('now'), ?, NULL, NULL, datetime('now'), 1)
    `).run(migrationName);
    console.log('Migration recorded in _prisma_migrations.');
  } else {
    console.log('Migration already recorded in _prisma_migrations.');
  }
}

db.close();
console.log('Done. Run `npx prisma generate` to regenerate the Prisma client.');

