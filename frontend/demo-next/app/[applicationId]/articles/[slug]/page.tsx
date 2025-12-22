import { apiFetch } from "../../../lib/api";
import type { Article } from "../../../lib/types";

type Props = {
  params: { applicationId: string; slug: string };
};

export default async function ArticleDetailPage({ params }: Props) {
  const article = await apiFetch<Article>(
    `/api/v1/public/${params.applicationId}/articles/${params.slug}`
  );

  return (
    <article className="card">
      <span className="pill">{article.status}</span>
      <h2 className="title">{article.title}</h2>
      <div
        className="muted"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
