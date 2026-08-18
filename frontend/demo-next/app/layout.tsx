import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "./site-nav";

export const metadata: Metadata = {
  title: "Content Platform — One engine, every experience",
  description: "Live multilingual showcase for the open-source, multi-tenant and API-first Content Platform.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003"),
  openGraph: {
    title: "Content Platform",
    description: "Create, govern and deliver content to every digital experience.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          <header className="topbar">
            <Link className="brand" href="/">
              Content Platform
            </Link>
            <SiteNav />
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
