import { apiFetch } from "../../lib/api";
import type { PageResponse, Video } from "../../lib/types";

type Props = {
  params: { applicationId: string };
};

export default async function VideosPage({ params }: Props) {
  const page = await apiFetch<PageResponse<Video>>(
    `/api/v1/public/${params.applicationId}/videos?status=PUBLISHED&page=0&size=10`
  );

  return (
    <section className="list">
      {page.items.map((video) => (
        <div key={video.id} className="card">
          <span className="pill">{video.status}</span>
          <h2 className="title">{video.title}</h2>
          {video.description && <p className="muted">{video.description}</p>}
          {video.presignedUrl && (
            <video controls style={{ width: "100%", borderRadius: "12px", marginTop: "12px" }}>
              <source src={video.presignedUrl} />
            </video>
          )}
        </div>
      ))}
      {page.items.length === 0 && (
        <div className="card">
          <p className="muted">No published videos yet.</p>
        </div>
      )}
    </section>
  );
}
