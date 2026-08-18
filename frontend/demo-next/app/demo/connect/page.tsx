"use client";

import { useEffect, useState } from "react";

export default function DemoConnectPage() {
  const [message, setMessage] = useState("Connecting your workspace…");
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const applicationId = params.get("applicationId");
    const token = params.get("token");
    window.history.replaceState({}, "", "/demo/connect");
    if (!applicationId || !token) {
      setMessage("The preview link is incomplete. Return to the admin studio and try again.");
      return;
    }
    fetch("/api/demo-connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId, token }) })
      .then((response) => { if (!response.ok) throw new Error(); window.location.replace("/posts"); })
      .catch(() => setMessage("Could not connect the workspace preview."));
  }, []);
  return <section className="connect-state"><span className="connect-spinner"/><h1>{message}</h1><p>Your delivery token stays in secure cookies and is removed from the address bar.</p></section>;
}
