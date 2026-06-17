// Generates batch SQL files under scripts/translate/batches/.
// Each file is ONE single statement (a bulk UPDATE ... FROM (VALUES ...)) covering
// a few reviews, small enough to paste into a one-statement SQL console.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';

const BATCH = 4; // reviews per file

const applySrc = readFileSync('scripts/translate/apply.mjs', 'utf8');
const slugs = [...applySrc.matchAll(/^\s*'([a-z0-9-]+)':\s*'(cmnn[a-z0-9]+)'/gm)]
  .map((m) => ({ slug: m[1], id: m[2] }));

const read = (slug, ext) => {
  const p = `scripts/translate/parts/${slug}.${ext}`;
  return existsSync(p) ? readFileSync(p, 'utf8').trim() : null;
};
const tag = 'grulla';
const dq = (s) => { if (s.includes(`$${tag}$`)) throw new Error('tag collision'); return `$${tag}$${s}$${tag}$`; };

const reviews = slugs
  .map(({ slug, id }) => ({ id, body: read(slug, 'body.md'), title: read(slug, 'title.txt') }))
  .filter((r) => r.body !== null && r.title !== null);

rmSync('scripts/translate/batches', { recursive: true, force: true });
mkdirSync('scripts/translate/batches', { recursive: true });

let fileNo = 0;
for (let i = 0; i < reviews.length; i += BATCH) {
  fileNo++;
  const chunk = reviews.slice(i, i + BATCH);
  const rows = chunk.map((r) => `  ('${r.id}', ${dq(r.body)}, ${dq(r.title)})`).join(',\n');
  const sql = `-- Batch ${fileNo}: ${chunk.length} reviews. Run this whole file as one statement.
UPDATE "Review" AS r SET "contentEn" = v.body, "titleEn" = v.title
FROM (VALUES
${rows}
) AS v(id, body, title)
WHERE r.id = v.id;
`;
  const name = `scripts/translate/batches/apply-${String(fileNo).padStart(2, '0')}.sql`;
  writeFileSync(name, sql);
}

// Final batch: the god-complex pair (single statement, no VALUES).
fileNo++;
const special = `-- Batch ${fileNo}: god-complex (already English) + complejo-de-dios (its Spanish twin).
UPDATE "Review" AS r SET "contentEn" = src.es, "titleEn" = 'God Complex'
FROM (SELECT "contentEs" AS es FROM "Review" WHERE slug = 'god-complex') AS src
WHERE r.slug IN ('god-complex', 'complejo-de-dios');
`;
writeFileSync(`scripts/translate/batches/apply-${String(fileNo).padStart(2, '0')}.sql`, special);

console.log(`Wrote ${fileNo} batch files (BATCH=${BATCH}) to scripts/translate/batches/`);
