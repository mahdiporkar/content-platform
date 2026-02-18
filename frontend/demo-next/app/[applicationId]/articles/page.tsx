import Link from "next/link";
import { apiFetch, getSingleParam } from "../../lib/api";
import type { DeliveryContent, PageResponse } from "../../lib/types";

type Props = {
  params: { applicationId: string };
  searchParams: { token?: string | string[] };
};

export default async function ArticlesPage({ params, searchParams }: Props) {
  const token = getSingleParam(searchParams.token);

  if (!token) {
    return (
      <div className="card">
        <p className="muted">Missing token. Go back and enter application credentials.</p>
      </div>
    );
  }

  const page = await apiFetch<PageResponse<DeliveryContent>>(
    `/api/v1/content/${params.applicationId}/articles?page=0&size=10`,
    { applicationId: params.applicationId, token }
  );

  return (
    <section className="list">
      {page.items.filter((article) => Boolean(article.slug)).map((article) => (
        <Link
          key={article.contentId}
          href={{
            pathname: `/${params.applicationId}/articles/${article.slug ?? ""}`,
            query: { token }
          }}
        >
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
