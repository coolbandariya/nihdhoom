#!/usr/bin/env node
/**
 * Joins every migration into one file you can paste into Supabase > SQL Editor.
 *
 *   npm run db:bundle
 *   -> supabase/all-migrations.sql
 *
 * Order follows docs/DATABASE-RELEASE-LEDGER.md. A few files use a short
 * 8-digit date prefix (20261001_, 20261006_); those sort at the END of that
 * day, after the 12-digit files of the same date, exactly as the ledger lists.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'supabase', 'migrations');
const outFile = path.join(root, 'supabase', 'all-migrations.sql');

export function migrationOrder(names) {
  const key = (name) => {
    const version = name.split('_')[0];
    return version.length < 12 ? version.padEnd(12, '9') : version;
  };
  return [...names]
    .filter((n) => n.endsWith('.sql'))
    .sort((a, b) => (key(a) === key(b) ? a.localeCompare(b) : key(a).localeCompare(key(b))));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const names = migrationOrder(fs.readdirSync(dir));
  const parts = [
    '-- NIRDHOOM: all migrations in release order.',
    '-- Paste into Supabase > SQL Editor and press Run ONCE on a fresh project.',
    '-- If it stops with an error, note the "-- >>> file" line above it, fix the cause,',
    '-- then run only the files from that one onward (see docs/GO-LIVE.md).',
    `-- Generated ${new Date().toISOString().slice(0, 10)} from ${names.length} files.`,
    '',
  ];
  for (const name of names) {
    parts.push(`-- >>> ${name}`);
    parts.push(fs.readFileSync(path.join(dir, name), 'utf8').trimEnd());
    parts.push('');
  }
  fs.writeFileSync(outFile, parts.join('\n'));
  console.log(`Wrote ${path.relative(root, outFile)} (${names.length} migrations, ${(fs.statSync(outFile).size / 1024).toFixed(0)} KB).`);
  names.forEach((n, i) => console.log(`${String(i + 1).padStart(2)}. ${n}`));
}
