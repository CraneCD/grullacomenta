-- Export reviews that have Spanish content but no English translation.
-- Run in the Prisma Studio SQL console. Returns one cell containing a JSON
-- array of the rows to translate. Copy that value and hand it back.
--
-- `to_jsonb(t)` includes whatever columns the table actually has (so titleEs /
-- titleEn are included if they exist); the bulky/irrelevant columns are dropped.

SELECT COALESCE(jsonb_pretty(jsonb_agg(row_obj ORDER BY created DESC)), '[]') AS untranslated
FROM (
  SELECT
    to_jsonb(t) - '{content,imageData,imageMimeType,coverImage}'::text[] AS row_obj,
    t."createdAt" AS created
  FROM "Review" t
  WHERE (t."contentEs" IS NOT NULL AND btrim(t."contentEs") <> '')
    AND (t."contentEn" IS NULL OR btrim(t."contentEn") = '')
) s;

-- Quick headcount only:
-- SELECT count(*) AS needs_translation
-- FROM "Review"
-- WHERE ("contentEs" IS NOT NULL AND btrim("contentEs") <> '')
--   AND ("contentEn" IS NULL OR btrim("contentEn") = '');
