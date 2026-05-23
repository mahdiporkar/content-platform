import { EmptyState, SectionHeader } from "../components/page-shell";
import { apiFetch, getServerApiAuth } from "../lib/api";
import type { DeliveryContent, PageResponse } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const page = await apiFetch<PageResponse<DeliveryContent>>(
    "/api/v1/content/videos?page=0&size=10",
    getServerApiAuth()
  );

  return (
    <section className="content-section">
      <SectionHeader
        eyebrow="Videos"
        title="Published videos"
        description="Video content delivered through the platform media gateway."
        count={page.totalElements}
      />
      <div className="video-list">
      {page.items.map((video) => (
        <article key={video.contentId} className="video-card">
          <div>
            <span className="content-meta">{video.status.toLowerCase()}</span>
            <h3>{video.title}</h3>
          </div>
          {video.description && <p className="muted">{video.description}</p>}
          {video.mediaUrl && (
            <video controls className="video-player">
              <source src={video.mediaUrl} />
            </video>
          )}
        </article>
      ))}
      </div>
      {page.items.length === 0 && (
        <EmptyState label="No published videos yet." />
      )}
    </section>
  );
}
