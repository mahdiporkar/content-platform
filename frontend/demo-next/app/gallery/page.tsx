import { EmptyState, SectionHeader } from "../components/page-shell";
import { apiFetch, getServerApiAuth } from "../lib/api";
import type { GalleryImage, PageResponse } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const page = await apiFetch<PageResponse<GalleryImage>>(
    "/api/v1/content/gallery?page=0&size=24",
    getServerApiAuth()
  );

  return (
    <section className="content-section">
      <SectionHeader
        eyebrow="Gallery"
        title="Featured gallery"
        description="Curated public images for this consumer site."
        count={page.totalElements}
      />
      <div className="media-grid">
        {page.items.map((image) => (
          <article className="media-card" key={`${image.url}-${image.caption ?? ""}`}>
            <img className="media-image" src={image.url} alt={image.alt ?? "gallery image"} />
            {image.caption && <p className="muted">{image.caption}</p>}
          </article>
        ))}
      </div>
      {page.items.length === 0 && (
        <EmptyState label="No gallery items found." />
      )}
    </section>
  );
}
