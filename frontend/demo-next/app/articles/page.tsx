import { ContentPreviewCard, EmptyState, SectionHeader } from "../components/page-shell";
import { apiFetch, getServerApiAuth } from "../lib/api";
import type { DeliveryContent, PageResponse } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const page = await apiFetch<PageResponse<DeliveryContent>>(
    "/api/v1/content/articles?page=0&size=10",
    getServerApiAuth()
  );

  return (
    <section className="content-section">
      <SectionHeader
        eyebrow="Articles"
        title="Editorial articles"
        description="Long-form content published for this site."
        count={page.totalElements}
      />
      <div className="content-grid">
      {page.items.filter((article) => Boolean(article.slug)).map((article) => (
        <ContentPreviewCard key={article.contentId} item={article} href={`/articles/${article.slug ?? ""}`} />
      ))}
      </div>
      {page.items.length === 0 && (
        <EmptyState label="No published articles yet." />
      )}
    </section>
  );
}
