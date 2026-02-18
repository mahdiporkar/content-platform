import AccessForm from "./components/access-form";

export default function HomePage() {
  return (
    <section className="grid">
      <div className="card">
        <span className="pill">Access</span>
        <h2 className="title">Application Credentials</h2>
        <p className="muted">
          Enter your <strong>applicationId</strong> and <strong>token</strong> to view
          posts, articles, gallery, and photos.
        </p>
        <AccessForm />
      </div>
      <div className="card">
        <span className="pill">Required Headers</span>
        <h2 className="title">Auth via token</h2>
        <p className="muted">
          The demo sends <code>x-app-id</code> and <code>x-application-token</code>
          with each request.
        </p>
      </div>
    </section>
  );
}
