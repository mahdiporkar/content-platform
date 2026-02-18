import { apiFetch, getSingleParam } from "../../lib/api";
import type { DeliveryContent, PageResponse } from "../../lib/types";

type Props = {
  params: { applicationId: string };
  searchParams: { token?: string | string[] };
};

export default async function VideosPage({ params, searchParams }: Props) {
  const token = getSingleParam(searchParams.token);

  if (!token) {
    return (
      <div className="card">
        <p className="muted">Missing token. Go back and enter application credentials.</p>
      </div>
    );
  }

  const page = await apiFetch<PageResponse<DeliveryContent>>(
    `/api/v1/content/${params.applicationId}/videos?page=0&size=10`,
    { applicationId: params.applicationId, token }
  );

  return (
    <section className="list">
      {page.items.map((video) => (
        <div key={video.contentId} className="card">
          <span className="pill">{video.status}</span>
          <h2 className="title">{video.title}</h2>
          {video.description && <p className="muted">{video.description}</p>}
          {video.mediaUrl && (
            <video controls style={{ width: "100%", borderRadius: "12px", marginTop: "12px" }}>
              <source src={video.mediaUrl} />
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
