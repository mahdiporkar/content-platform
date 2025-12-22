import Link from "next/link";
import { apiFetch } from "../../lib/api";
import type { PageResponse, Post } from "../../lib/types";

type Props = {
  params: { applicationId: string };
};

export default async function PostsPage({ params }: Props) {
  const page = await apiFetch<PageResponse<Post>>(
    `/api/v1/public/${params.applicationId}/posts?status=PUBLISHED&page=0&size=10`
  );

  return (
    <section className="list">
      {page.items.map((post) => (
        <Link key={post.id} href={`/${params.applicationId}/posts/${post.slug}`}>
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
