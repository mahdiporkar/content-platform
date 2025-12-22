import { apiFetch } from "../../../lib/api";
import type { Post } from "../../../lib/types";

type Props = {
  params: { applicationId: string; slug: string };
};

export default async function PostDetailPage({ params }: Props) {
  const post = await apiFetch<Post>(
    `/api/v1/public/${params.applicationId}/posts/${params.slug}`
  );

  return (
    <article className="card">
      <span className="pill">{post.status}</span>
      <h2 className="title">{post.title}</h2>
      <div
        className="muted"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
