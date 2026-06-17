/**
 * Apply English translations to the live database.
 *
 * Reads, for each slug below, the files:
 *   scripts/translate/parts/<slug>.title.txt   (one-line English title)
 *   scripts/translate/parts/<slug>.body.md     (English body / contentEn)
 * and writes them onto the matching Review row (matched by id).
 *
 * Slugs without part files yet are skipped, so this is safe to run repeatedly
 * as batches of translations land.
 *
 * Run on a machine that can reach the DB:
 *   npm install pg
 *   DATABASE_URL="postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require" \
 *     node scripts/translate/apply.mjs
 */
import pg from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SLUG_TO_ID = {
  'shoot': 'cmnn87aur001zcnded94p6yju',
  'shoko': 'cmnn87als001xcndedn08xqae',
  'sedosa-acrobatica': 'cmnn87ad0001vcndex5ed0jav',
  'sanji': 'cmnn87a3h001tcndeqowwdljm',
  'ryomen-sukuna-el-trono-vacio-de-la-perfeccion-malevola': 'cmnn879ud001rcnde14drkkb9',
  'rui': 'cmnn879l7001pcndefnwzevv9',
  'reggie': 'cmnn879cd001ncndeq8zxyxfw',
  'panda': 'cmnn8793p001lcndelk22z3we',
  'nezuko': 'cmnn878up001jcndex5qmi976',
  'netero-vs-meruem': 'cmnn878m0001hcndea4cym2ay',
  'meruem': 'cmnn878cp001fcndebgobzrpx',
  'mechamaru': 'cmnn8783x001dcnde3rrf23oc',
  'mai-yorozu': 'cmnn877v6001bcnde9ka4yn00',
  'leorio': 'cmnn877m70019cndevlkoqsf4',
  'kusakabe': 'cmnn877dd0017cndeofhwjm10',
  'kurapika': 'cmnn8773r0015cnde1a2pm1i4',
  'korourushi': 'cmnn876uz0013cndevpenz9f5',
  'knuckle': 'cmnn876m50011cndeqs5j9o35',
  'kite': 'cmnn876d9000zcndeo7n245tl',
  'killua': 'cmnn87641000xcndekpkhz447',
  'jogo': 'cmnn875sj000vcndeovuh0au4',
  'hisoka': 'cmnn875hb000tcndevfvi9496',
  'higuruma': 'cmnn8758h000rcnde5orn3ezg',
  'hazenoki': 'cmnn874zr000pcnde3vkb53fo',
  'hanami': 'cmnn874qr000ncndeequej97e',
  'gon-freecs': 'cmnn874hl000lcndeyvn99626',
  'gachiakuta-givers-y-jinkis': 'cmnn873yd000hcndenlhd7tnj',
  'espada': 'cmnn873oi000fcnde3g9edrqg',
  'espada-parte-2': 'cmnn873ep000dcndeqf5c483h',
  'dagon': 'cmnn8735l000bcndecqpj8djm',
  'chrollo-lucilfer': 'cmnn872ij0007cndenjlmda93',
  'camaron-mantis': 'cmnn8729c0005cnde8333utlz',
  'angel': 'cmnn871zz0003cndew8gwtp70',
  'aliens-serpo': 'cmnn871ky0001cndevkrmkmbk',
  // 'complejo-de-dios' and 'god-complex' handled specially below (not via part files).
};

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL to the direct postgres:// connection string.');
  process.exit(1);
}

const partsDir = fileURLToPath(new URL('./parts', import.meta.url));
const read = (slug, ext) => {
  const p = `${partsDir}/${slug}.${ext}`;
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
};

const client = new pg.Client({ connectionString: url });
await client.connect();

let updated = 0, skipped = 0;
for (const [slug, id] of Object.entries(SLUG_TO_ID)) {
  const title = read(slug, 'title.txt');
  const body = read(slug, 'body.md');
  if (title === null || body === null) { skipped++; continue; }
  await client.query(
    'UPDATE "Review" SET "contentEn" = $1, "titleEn" = $2 WHERE id = $3',
    [body.trim(), title.trim(), id]
  );
  console.log(`updated ${slug}`);
  updated++;
}

// 'god-complex' is already written in English (stored in contentEs); just copy it.
const gc = await client.query(
  `UPDATE "Review" SET "contentEn" = "contentEs", "titleEn" = 'God Complex'
   WHERE slug = 'god-complex' AND ("contentEn" IS NULL OR btrim("contentEn") = '')`
);
if (gc.rowCount) console.log('updated god-complex (copied existing English)');

// 'complejo-de-dios' is the Spanish version of the same essay as 'god-complex';
// its English translation is god-complex's (English) contentEs.
const cdd = await client.query(
  `UPDATE "Review" SET
     "contentEn" = (SELECT "contentEs" FROM "Review" WHERE slug = 'god-complex'),
     "titleEn" = 'God Complex'
   WHERE slug = 'complejo-de-dios' AND ("contentEn" IS NULL OR btrim("contentEn") = '')`
);
if (cdd.rowCount) console.log('updated complejo-de-dios (reused god-complex English)');

console.log(`\nDone. Updated ${updated} from part files, skipped ${skipped} (no files yet).`);
await client.end();
