import Link from "next/link";
import { apiFetch } from "../../lib/api";
import type { Article, PageResponse } from "../../lib/types";

type Props = {
  params: { applicationId: string };
};

export default async function ArticlesPage({ params }: Props) {
  const page = await apiFetch<PageResponse<Article>>(
    `/api/v1/public/${params.applicationId}/articles?status=PUBLISHED&page=0&size=10`
  );

  return (
    <section className="list">
      {page.items.map((article) => (
        <Link key={article.id} href={`/${params.applicationId}/articles/${article.slug}`}>
          <div className="card">
            <span className="pill">{article.status}</span>
            <h2 className="title">{article.title}</h2>
            <p className="muted">{article.slug}</p>
          </div>
        </Link>
      ))}
      {page.items.length === 0 && (
        <div className="card">
          <p className="muted">No published articles yet.</p>
        </div>
      )}
    </section>
  );
}
