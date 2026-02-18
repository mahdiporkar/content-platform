import { apiFetch, getSingleParam } from "../../lib/api";
import type { DeliveryContent, PageResponse } from "../../lib/types";

type Props = {
  params: { applicationId: string };
  searchParams: { token?: string | string[] };
};

export default async function PhotosPage({ params, searchParams }: Props) {
  const token = getSingleParam(searchParams.token);

  if (!token) {
    return (
      <div className="card">
        <p className="muted">Missing token. Go back and enter application credentials.</p>
      </div>
    );
  }

  const page = await apiFetch<PageResponse<DeliveryContent>>(
    `/api/v1/content/${params.applicationId}?type=image&page=0&size=24`,
    { applicationId: params.applicationId, token }
  );

  return (
    <section className="list">
      <div className="card">
        <span className="pill">Photos</span>
        <p className="muted">{page.totalElements} image(s)</p>
      </div>
      <div className="grid">
        {page.items.map((photo) => (
          <div className="card" key={photo.contentId}>
            {photo.mediaUrl && (
              <img className="media-image" src={photo.mediaUrl} alt={photo.altText ?? photo.title} />
            )}
            <h3>{photo.title}</h3>
            {photo.description && <p className="muted">{photo.description}</p>}
          </div>
        ))}
      </div>
      {page.items.length === 0 && (
        <div className="card">
          <p className="muted">No published photos yet.</p>
        </div>
      )}
    </section>
  );
}
