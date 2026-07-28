ALTER TABLE "GalleryPost"
ADD COLUMN "images" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "GalleryPost"
ADD CONSTRAINT "GalleryPost_images_array"
CHECK (jsonb_typeof("images") = 'array');
