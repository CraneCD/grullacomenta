// Generates scripts/translate/apply.sql from the translated part files.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const applySrc = readFileSync('scripts/translate/apply.mjs', 'utf8');
const slugs = [...applySrc.matchAll(/^\s*'([a-z0-9-]+)':\s*'(cmnn[a-z0-9]+)'/gm)]
  .map((m) => ({ slug: m[1], id: m[2] }));

const read = (slug, ext) => {
  const p = `scripts/translate/parts/${slug}.${ext}`;
  return existsSync(p) ? readFileSync(p, 'utf8').trim() : null;
};

// Pick a dollar-quote tag that appears in no content.
const tag = 'grulla';
const dq = (s) => {
  if (s.includes(`$${tag}$`)) throw new Error(`tag collision in content`);
  return `$${tag}$${s}$${tag}$`;
};

let out = `-- Apply English translations to the Review table.
-- Generated from scripts/translate/parts/. Run in the Prisma Studio SQL console
-- (or: psql "$DATABASE_URL" -f scripts/translate/apply.sql).
-- Uses dollar-quoting ($${tag}$...$${tag}$) so no escaping is needed.

BEGIN;

`;

let n = 0;
for (const { slug, id } of slugs) {
  const title = read(slug, 'title.txt');
  const body = read(slug, 'body.md');
  if (title === null || body === null) continue;
  out += `UPDATE "Review" SET "contentEn" = ${dq(body)}, "titleEn" = ${dq(title)} WHERE id = '${id}';\n\n`;
  n++;
}

// god-complex: content is already English (stored in contentEs).
out += `UPDATE "Review" SET "contentEn" = "contentEs", "titleEn" = 'God Complex'
WHERE slug = 'god-complex' AND ("contentEn" IS NULL OR btrim("contentEn") = '');

`;
// complejo-de-dios: Spanish twin of god-complex; reuse god-complex's English.
out += `UPDATE "Review" SET
  "contentEn" = (SELECT "contentEs" FROM "Review" WHERE slug = 'god-complex'),
  "titleEn" = 'God Complex'
WHERE slug = 'complejo-de-dios' AND ("contentEn" IS NULL OR btrim("contentEn") = '');

COMMIT;
`;

writeFileSync('scripts/translate/apply.sql', out);
console.log(`Wrote scripts/translate/apply.sql with ${n} part-file UPDATEs + 2 special UPDATEs.`);
