import { ContentPreviewCard, EmptyState, SectionHeader } from "../components/page-shell";
import { apiFetch, getServerApiAuth } from "../lib/api";
import type { DeliveryContent, PageResponse } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const page = await apiFetch<PageResponse<DeliveryContent>>(
    "/api/v1/content/posts?page=0&size=10",
    getServerApiAuth()
  );

  return (
    <section className="content-section">
      <SectionHeader
        eyebrow="Posts"
        title="Latest posts"
        description="Published posts available to this consumer site."
        count={page.totalElements}
      />
      <div className="content-grid">
      {page.items.filter((post) => Boolean(post.slug)).map((post) => (
        <ContentPreviewCard key={post.contentId} item={post} href={`/posts/${post.slug ?? ""}`} />
      ))}
      </div>
      {page.items.length === 0 && (
        <EmptyState label="No published posts yet." />
      )}
    </section>
  );
}
