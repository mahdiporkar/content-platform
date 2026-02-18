import Link from "next/link";
import TenantNav from "./tenant-nav";

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
          <Link href="/">Change credentials</Link>
          <TenantNav applicationId={applicationId} />
        </div>
      </div>
      {children}
    </section>
  );
}
