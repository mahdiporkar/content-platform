import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "./site-nav";

export const metadata: Metadata = {
  title: "Content Platform Demo",
  description: "Public demo website for the multi-tenant content platform."
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
