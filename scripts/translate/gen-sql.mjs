// Generates scripts/translate/apply.sql as TWO single statements (console-friendly):
//  1) one bulk UPDATE ... FROM (VALUES ...) covering all part-file translations
//  2) one statement for god-complex + complejo-de-dios (both reuse god-complex's English)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const applySrc = readFileSync('scripts/translate/apply.mjs', 'utf8');
const slugs = [...applySrc.matchAll(/^\s*'([a-z0-9-]+)':\s*'(cmnn[a-z0-9]+)'/gm)]
  .map((m) => ({ slug: m[1], id: m[2] }));

const read = (slug, ext) => {
  const p = `scripts/translate/parts/${slug}.${ext}`;
  return existsSync(p) ? readFileSync(p, 'utf8').trim() : null;
};

const tag = 'grulla';
const dq = (s) => {
  if (s.includes(`$${tag}$`)) throw new Error('tag collision');
  return `$${tag}$${s}$${tag}$`;
};

const rows = [];
for (const { slug, id } of slugs) {
  const title = read(slug, 'title.txt');
  const body = read(slug, 'body.md');
  if (title === null || body === null) continue;
  rows.push(`  ('${id}', ${dq(body)}, ${dq(title)})`);
}

let out = `-- Apply English translations to the Review table.
-- TWO single statements (run each one separately if your SQL console executes
-- one statement at a time, e.g. Prisma Studio). No BEGIN/COMMIT.

-- 1) Bulk update of all translated reviews (matched by id).
UPDATE "Review" AS r
SET "contentEn" = v.body, "titleEn" = v.title
FROM (VALUES
${rows.join(',\n')}
) AS v(id, body, title)
WHERE r.id = v.id;

-- 2) god-complex (already English) and complejo-de-dios (its Spanish twin):
--    both take god-complex's English contentEs.
UPDATE "Review" AS r
SET "contentEn" = src.es, "titleEn" = 'God Complex'
FROM (SELECT "contentEs" AS es FROM "Review" WHERE slug = 'god-complex') AS src
WHERE r.slug IN ('god-complex', 'complejo-de-dios')
  AND (r."contentEn" IS NULL OR btrim(r."contentEn") = '');
`;

writeFileSync('scripts/translate/apply.sql', out);
console.log(`Wrote apply.sql: bulk UPDATE with ${rows.length} rows + 1 special UPDATE.`);
