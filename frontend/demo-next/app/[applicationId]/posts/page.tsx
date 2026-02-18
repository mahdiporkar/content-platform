import Link from "next/link";
import { apiFetch, getSingleParam } from "../../lib/api";
import type { DeliveryContent, PageResponse } from "../../lib/types";

type Props = {
  params: { applicationId: string };
  searchParams: { token?: string | string[] };
};

export default async function PostsPage({ params, searchParams }: Props) {
  const token = getSingleParam(searchParams.token);

  if (!token) {
    return (
      <div className="card">
        <p className="muted">Missing token. Go back and enter application credentials.</p>
      </div>
    );
  }

  const page = await apiFetch<PageResponse<DeliveryContent>>(
    `/api/v1/content/${params.applicationId}/posts?page=0&size=10`,
    { applicationId: params.applicationId, token }
  );

  return (
    <section className="list">
      {page.items.filter((post) => Boolean(post.slug)).map((post) => (
        <Link
          key={post.contentId}
          href={{
            pathname: `/${params.applicationId}/posts/${post.slug ?? ""}`,
            query: { token }
          }}
        >
          <div className="card">
            <span className="pill">{post.status}</span>
            <h2 className="title">{post.title}</h2>
            <p className="muted">{post.slug}</p>
          </div>
        </Link>
      ))}
      {page.items.length === 0 && (
        <div className="card">
          <p className="muted">No published posts yet.</p>
        </div>
      )}
    </section>
  );
}
