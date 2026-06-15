-- Batch 10: god-complex (already English) + complejo-de-dios (its Spanish twin).
UPDATE "Review" AS r SET "contentEn" = src.es, "titleEn" = 'God Complex'
FROM (SELECT "contentEs" AS es FROM "Review" WHERE slug = 'god-complex') AS src
WHERE r.slug IN ('god-complex', 'complejo-de-dios');
