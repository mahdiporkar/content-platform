import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Platform Demo",
  description: "Public demo website for the multi-tenant content platform."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          <header className="hero">
            <div>
              <p className="eyebrow">Public Demo</p>
              <h1>Content Platform</h1>
              <p className="subtitle">
                A multi-tenant publishing surface for posts, articles, and video.
              </p>
            </div>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
