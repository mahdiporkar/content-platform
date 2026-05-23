import { apiFetch, getServerApiAuth } from "../../lib/api";
import type { DeliveryContent } from "../../lib/types";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export default async function ArticleDetailPage({ params }: Props) {
  const article = await apiFetch<DeliveryContent>(
    `/api/v1/content/articles/${params.slug}`,
    getServerApiAuth()
  );

  return (
    <article className="article-view">
      <div className="article-head">
        <span className="pill">{article.status.toLowerCase()}</span>
        <h1>{article.title}</h1>
        {article.description && <p>{article.description}</p>}
      </div>
      {article.mediaUrl && (
        <img className="article-media" src={article.mediaUrl} alt={article.altText ?? article.title} />
      )}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content ?? "" }} />
    </article>
  );
}
