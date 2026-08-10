-- AlterTable
ALTER TABLE "SiteSettings"
ADD COLUMN "heroImages" JSONB NOT NULL DEFAULT '[]';

-- Backfill the carousel from the legacy hero pair.
UPDATE "SiteSettings"
SET "heroImages" = jsonb_build_array(
  jsonb_build_object(
    'url', "heroImageUrl",
    'alt', "heroImageAlt"
  )
)
WHERE "heroImageUrl" IS NOT NULL
  AND "heroImageAlt" IS NOT NULL
  AND jsonb_array_length("heroImages") = 0;
