import { apiFetch, getServerApiAuth } from "../../lib/api";
import type { DeliveryContent } from "../../lib/types";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export default async function PostDetailPage({ params }: Props) {
  const post = await apiFetch<DeliveryContent>(
    `/api/v1/content/posts/${params.slug}`,
    getServerApiAuth()
  );

  return (
    <article className="article-view">
      <div className="article-head">
        <span className="pill">{post.status.toLowerCase()}</span>
        <h1>{post.title}</h1>
        {post.description && <p>{post.description}</p>}
      </div>
      {post.mediaUrl && <img className="article-media" src={post.mediaUrl} alt={post.altText ?? post.title} />}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
    </article>
  );
}
