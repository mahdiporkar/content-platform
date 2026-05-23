import SiteNav from "./site-nav";

export default function HomePage() {
  return (
    <section className="home">
      <div className="home-copy">
        <p className="eyebrow">Publication</p>
        <h1>Stories, media, and collections from this site.</h1>
        <p>
          This public consumer app renders content on the server and sends only browser-safe media URLs to visitors.
        </p>
        <SiteNav />
      </div>
      <div className="home-panel" aria-hidden="true">
        <div className="panel-row" />
        <div className="panel-row short" />
        <div className="panel-media" />
      </div>
    </section>
  );
}
