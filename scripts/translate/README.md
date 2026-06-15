# Translate untranslated reviews (ES → EN)

This environment cannot reach the Prisma database (network egress allowlist),
so translation is done as a 3-step export / translate / apply workflow. Steps 1
and 3 run on a machine with database access (e.g. your laptop); step 2 is done
here.

## 1. Export (you, locally)

```bash
npm install pg
DATABASE_URL="postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require" \
  node scripts/translate/export.mjs
```

This writes `scripts/translate/untranslated.json` listing every review that has
`contentEs` but an empty `contentEn`. Send it back: commit + push to this
branch, or paste its contents into the chat.

## 2. Translate (me, here)

I produce `scripts/translate/translated.json` — the same rows with `contentEn`
(and `titleEn` if that column exists) filled in — plus an `apply.mjs` script.

## 3. Apply (you, locally)

```bash
DATABASE_URL="postgres://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require" \
  node scripts/translate/apply.mjs
```

This writes the English fields directly onto the live rows (matched by `id`),
leaving every other field — including `status` — unchanged.
