import { EmptyState, SectionHeader } from "../components/page-shell";
import { apiFetch, getServerApiAuth } from "../lib/api";
import type { DeliveryContent, PageResponse } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const page = await apiFetch<PageResponse<DeliveryContent>>(
    "/api/v1/content?type=image&page=0&size=24",
    getServerApiAuth()
  );

  return (
    <section className="content-section">
      <SectionHeader
        eyebrow="Photos"
        title="Image library"
        description="Published image content served through the media proxy."
        count={page.totalElements}
      />
      <div className="media-grid">
        {page.items.map((photo) => (
          <article className="media-card" key={photo.contentId}>
            {photo.mediaUrl && (
              <img className="media-image" src={photo.mediaUrl} alt={photo.altText ?? photo.title} />
            )}
            <h3>{photo.title}</h3>
            {photo.description && <p className="muted">{photo.description}</p>}
          </article>
        ))}
      </div>
      {page.items.length === 0 && (
        <EmptyState label="No published photos yet." />
      )}
    </section>
  );
}
