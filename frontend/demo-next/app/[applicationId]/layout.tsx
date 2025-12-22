import Link from "next/link";

export default function ApplicationLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { applicationId: string };
}) {
  const { applicationId } = params;
  return (
    <section className="list">
      <div className="card">
        <strong>Tenant</strong>
        <p className="muted">{applicationId}</p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href={`/${applicationId}/posts`}>Posts</Link>
          <Link href={`/${applicationId}/articles`}>Articles</Link>
          <Link href={`/${applicationId}/videos`}>Videos</Link>
        </div>
      </div>
      {children}
    </section>
  );
}
