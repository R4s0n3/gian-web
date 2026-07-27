-- Allow one uploaded media object to be reused by multiple gallery posts.
DROP INDEX IF EXISTS "GalleryPost_imageUrl_key";
