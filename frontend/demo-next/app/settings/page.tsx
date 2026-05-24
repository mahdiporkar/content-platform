import { cookies } from "next/headers";
import { API_TOKEN_COOKIE, APPLICATION_ID_COOKIE } from "../lib/api";
import { clearCredentials, saveCredentials } from "./actions";

type Props = {
  searchParams: {
    cleared?: string;
    error?: string;
  };
};

export default function SettingsPage({ searchParams }: Props) {
  const cookieStore = cookies();
  const applicationId =
    cookieStore.get(APPLICATION_ID_COOKIE)?.value ||
    process.env.CONTENT_PLATFORM_APPLICATION_ID ||
    "";
  const hasToken = Boolean(
    cookieStore.get(API_TOKEN_COOKIE)?.value ||
    process.env.CONTENT_PLATFORM_API_TOKEN
  );

  return (
    <section className="settings-shell">
      <div className="settings-copy">
        <p className="eyebrow">Connection</p>
        <h1>Content platform credentials</h1>
        <p>
          Enter the application id and API token for this consumer site. They are stored in server-only cookies and added to delivery API requests as headers.
        </p>
      </div>

      <div className="settings-card">
        {searchParams.error === "missing" && (
          <p className="form-alert">Application id and API token are required.</p>
        )}
        {searchParams.cleared && (
          <p className="form-note">Stored credentials were cleared.</p>
        )}
        <form className="settings-form" action={saveCredentials}>
          <label htmlFor="applicationId">Application id</label>
          <input
            id="applicationId"
            name="applicationId"
            className="input"
            defaultValue={applicationId}
            placeholder="application id"
            autoComplete="off"
          />

          <label htmlFor="apiToken">API token</label>
          <input
            id="apiToken"
            name="apiToken"
            className="input"
            type="password"
            placeholder={hasToken ? "Configured; enter a new token to replace it" : "api token"}
            autoComplete="off"
          />

          <button className="button" type="submit">Save and view content</button>
        </form>

        <form action={clearCredentials}>
          <button className="button secondary" type="submit">Clear stored credentials</button>
        </form>
      </div>
    </section>
  );
}
