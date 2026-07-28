import { ArtworkCard } from "@/app/_components/artwork-card";
import { getPublicGallery } from "@/app/_lib/content";
import type { GalleryCategory } from "@/app/_lib/content-shared";
import { galleryCategoryPresentation } from "@/app/_lib/gallery-categories";

type CategoryArchiveProps = {
  category: GalleryCategory;
  eyebrow: string;
  title: string;
  introduction: string;
  emptyTitle: string;
  emptyDescription: string;
};

export async function CategoryArchive({
  category,
  eyebrow,
  title,
  introduction,
  emptyTitle,
  emptyDescription,
}: CategoryArchiveProps) {
  const gallery = await getPublicGallery(category);
  const artworks = gallery.filter((artwork) => artwork.category === category);
  const categoryPresentation = galleryCategoryPresentation[category];

  return (
    <main
      className={`portfolio-archive portfolio-archive--${categoryPresentation.className}`}
      id="main-content"
    >
      <header className="portfolio-archive__header">
        <div className="site-shell portfolio-archive__intro">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display portfolio-archive__title">{title}</h1>
          <p className="portfolio-archive__description">{introduction}</p>
        </div>
      </header>

      <section
        aria-label={categoryPresentation.plural}
        className="section portfolio-archive__works"
      >
        <div className="site-shell">
          {artworks.length > 0 ? (
            <div
              className={`artwork-grid artwork-grid--archive artwork-grid--${categoryPresentation.className}`}
            >
              {artworks.map((artwork, index) => (
                <ArtworkCard artwork={artwork} index={index} key={artwork.id} />
              ))}
            </div>
          ) : (
            <div className="public-empty" role="status">
              <p className="eyebrow">{emptyTitle}</p>
              <p>{emptyDescription}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
