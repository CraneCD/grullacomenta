-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentEs" TEXT,
    "contentEn" TEXT,
    "category" TEXT NOT NULL,
    "platform" TEXT,
    "rating" REAL,
    "coverImage" TEXT,
    "imageData" TEXT,
    "imageMimeType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("authorId", "category", "content", "contentEn", "contentEs", "coverImage", "createdAt", "id", "imageData", "imageMimeType", "platform", "rating", "slug", "status", "title", "updatedAt") SELECT "authorId", "category", "content", "contentEn", "contentEs", "coverImage", "createdAt", "id", "imageData", "imageMimeType", "platform", "rating", "slug", "status", "title", "updatedAt" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE UNIQUE INDEX "Review_slug_key" ON "Review"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
