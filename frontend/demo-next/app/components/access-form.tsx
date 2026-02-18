"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccessForm() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const appId = applicationId.trim();
    const appToken = token.trim();

    if (!appId || !appToken) {
      return;
    }

    router.push(`/${encodeURIComponent(appId)}/posts?token=${encodeURIComponent(appToken)}`);
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="muted" htmlFor="applicationId">
        applicationId
      </label>
      <input
        id="applicationId"
        className="input"
        value={applicationId}
        onChange={(event) => setApplicationId(event.target.value)}
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      />

      <label className="muted" htmlFor="token">
        token
      </label>
      <input
        id="token"
        className="input"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="application token"
      />

      <button className="button" type="submit">
        View content
      </button>
    </form>
  );
}
