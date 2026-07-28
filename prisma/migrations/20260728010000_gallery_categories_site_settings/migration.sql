-- Categorize public work without changing the meaning of existing records.
-- PostgreSQL fills all existing rows with the column default as it is added.
CREATE TYPE "GalleryCategory" AS ENUM ('PAINTING', 'PHOTOGRAPHY');

ALTER TABLE "GalleryPost"
ADD COLUMN "category" "GalleryCategory" NOT NULL DEFAULT 'PAINTING';

CREATE INDEX "GalleryPost_category_published_sortOrder_publishedAt_idx"
ON "GalleryPost"("category", "published", "sortOrder", "publishedAt");

-- There is exactly one row of website-level settings. The API always addresses
-- it by this stable key and the constraints defend the invariant at rest.
CREATE TABLE "SiteSettings" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'primary',
    "heroImageUrl" VARCHAR(500),
    "heroImageAlt" VARCHAR(250),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SiteSettings_singleton_check" CHECK ("id" = 'primary'),
    CONSTRAINT "SiteSettings_hero_pair_check" CHECK (
        ("heroImageUrl" IS NULL AND "heroImageAlt" IS NULL)
        OR
        ("heroImageUrl" IS NOT NULL AND "heroImageAlt" IS NOT NULL)
    )
);
