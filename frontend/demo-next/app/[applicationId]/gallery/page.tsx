import { apiFetch, getSingleParam } from "../../lib/api";
import type { GalleryImage, PageResponse } from "../../lib/types";

type Props = {
  params: { applicationId: string };
  searchParams: { token?: string | string[] };
};

export default async function GalleryPage({ params, searchParams }: Props) {
  const token = getSingleParam(searchParams.token);

  if (!token) {
    return (
      <div className="card">
        <p className="muted">Missing token. Go back and enter application credentials.</p>
      </div>
    );
  }

  const page = await apiFetch<PageResponse<GalleryImage>>(
    `/api/v1/content/${params.applicationId}/gallery?page=0&size=24`,
    { applicationId: params.applicationId, token }
  );

  return (
    <section className="list">
      <div className="card">
        <span className="pill">Gallery</span>
        <p className="muted">{page.totalElements} image(s)</p>
      </div>
      <div className="grid">
        {page.items.map((image) => (
          <div className="card" key={`${image.url}-${image.caption ?? ""}`}>
            <img className="media-image" src={image.url} alt={image.alt ?? "gallery image"} />
            {image.caption && <p className="muted">{image.caption}</p>}
          </div>
        ))}
      </div>
      {page.items.length === 0 && (
        <div className="card">
          <p className="muted">No gallery items found.</p>
        </div>
      )}
    </section>
  );
}
