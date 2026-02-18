import { apiFetch, getSingleParam } from "../../../lib/api";
import type { DeliveryContent } from "../../../lib/types";

type Props = {
  params: { applicationId: string; slug: string };
  searchParams: { token?: string | string[] };
};

export default async function PostDetailPage({ params, searchParams }: Props) {
  const token = getSingleParam(searchParams.token);

  if (!token) {
    return (
      <div className="card">
        <p className="muted">Missing token. Go back and enter application credentials.</p>
      </div>
    );
  }

  const post = await apiFetch<DeliveryContent>(`/api/v1/content/${params.applicationId}/posts/${params.slug}`, {
    applicationId: params.applicationId,
    token
  });

  return (
    <article className="card">
      <span className="pill">{post.status}</span>
      <h2 className="title">{post.title}</h2>
      <div className="muted" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
    </article>
  );
}
