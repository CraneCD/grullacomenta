/**
 * Export reviews that have Spanish content but no English translation.
 *
 * Run this on a machine that can reach the database (e.g. your laptop):
 *
 *   npm install pg
 *   DATABASE_URL="postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require" \
 *     node scripts/translate/export.mjs
 *
 * Output: scripts/translate/untranslated.json
 *
 * Send that file back (commit + push to this branch, or paste its contents).
 */
import pg from 'pg';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL to the direct postgres:// connection string.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

// Discover which optional translation columns exist on this database.
const { rows: colRows } = await client.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'Review'`
);
const cols = new Set(colRows.map((r) => r.column_name));
const hasTitleEs = cols.has('titleEs');
const hasTitleEn = cols.has('titleEn');

const select = [
  'id', 'slug', 'status', 'category', 'title',
  '"contentEs"', '"contentEn"',
  ...(hasTitleEs ? ['"titleEs"'] : []),
  ...(hasTitleEn ? ['"titleEn"'] : []),
].join(', ');

// Needs translation: Spanish content present, English content missing/blank.
const { rows } = await client.query(
  `SELECT ${select}
   FROM "Review"
   WHERE ("contentEs" IS NOT NULL AND btrim("contentEs") <> '')
     AND ("contentEn" IS NULL OR btrim("contentEn") = '')
   ORDER BY "createdAt" DESC NULLS LAST`
);

const out = fileURLToPath(new URL('./untranslated.json', import.meta.url));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ hasTitleEs, hasTitleEn, count: rows.length, rows }, null, 2));

console.log(`Columns present: titleEs=${hasTitleEs} titleEn=${hasTitleEn}`);
console.log(`Reviews needing English translation: ${rows.length}`);
for (const r of rows) {
  console.log(` - ${r.slug}  (${r.status}, ${r.category})  "${r.title}"`);
}
console.log(`\nWrote ${out}`);

await client.end();
