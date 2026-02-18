import { apiFetch, getSingleParam } from "../../../lib/api";
import type { DeliveryContent } from "../../../lib/types";

type Props = {
  params: { applicationId: string; slug: string };
  searchParams: { token?: string | string[] };
};

export default async function ArticleDetailPage({ params, searchParams }: Props) {
  const token = getSingleParam(searchParams.token);

  if (!token) {
    return (
      <div className="card">
        <p className="muted">Missing token. Go back and enter application credentials.</p>
      </div>
    );
  }

  const article = await apiFetch<DeliveryContent>(
    `/api/v1/content/${params.applicationId}/articles/${params.slug}`,
    {
      applicationId: params.applicationId,
      token
    }
  );

  return (
    <article className="card">
      <span className="pill">{article.status}</span>
      <h2 className="title">{article.title}</h2>
      <div className="muted" dangerouslySetInnerHTML={{ __html: article.content ?? "" }} />
    </article>
  );
}
