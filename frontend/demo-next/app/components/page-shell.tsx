import Link from "next/link";
import type { DeliveryContent } from "../lib/types";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  count?: number;
};

export function SectionHeader({ eyebrow, title, description, count }: SectionHeaderProps) {
  return (
    <header className="section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p className="section-copy">{description}</p>}
      </div>
      {typeof count === "number" && <span className="count-badge">{count}</span>}
    </header>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <p>{label}</p>
    </div>
  );
}

export function ContentPreviewCard({
  item,
  href
}: {
  item: DeliveryContent;
  href?: string;
}) {
  const content = (
    <article className="content-card">
      {item.mediaUrl && (
        <img className="content-thumb" src={item.mediaUrl} alt={item.altText ?? item.title} />
      )}
      <div className="content-card-body">
        <div className="content-meta">
          <span>{item.type.toLowerCase()}</span>
          <span>{item.status.toLowerCase()}</span>
        </div>
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
        {item.slug && <span className="slug-label">{item.slug}</span>}
      </div>
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
