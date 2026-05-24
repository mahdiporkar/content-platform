import Link from "next/link";

export default function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <Link href="/posts">Posts</Link>
      <Link href="/articles">Articles</Link>
      <Link href="/gallery">Gallery</Link>
      <Link href="/photos">Photos</Link>
      <Link href="/videos">Videos</Link>
      <Link href="/settings">Settings</Link>
    </nav>
  );
}
