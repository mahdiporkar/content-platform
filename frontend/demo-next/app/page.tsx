export default function HomePage() {
  return (
    <section className="grid">
      <div className="card">
        <span className="pill">Getting started</span>
        <h2 className="title">Pick a tenant</h2>
        <p className="muted">
          Use the seeded <strong>applicationId</strong> from the backend logs to explore
          posts, articles, and videos.
        </p>
        <p className="muted">
          Example routes:
          <br />
          <code>/{`{applicationId}`}/posts</code>
          <br />
          <code>/{`{applicationId}`}/articles</code>
          <br />
          <code>/{`{applicationId}`}/videos</code>
        </p>
      </div>
      <div className="card">
        <span className="pill">Public APIs</span>
        <h2 className="title">Read-only</h2>
        <p className="muted">
          The demo reads only published content from the public endpoints. Drafts and
          archived items remain hidden.
        </p>
      </div>
    </section>
  );
}
