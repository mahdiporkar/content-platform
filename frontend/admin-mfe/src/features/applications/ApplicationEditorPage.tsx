import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import client from "../../api/client";
import { Application } from "../../types";

type Mode = "create" | "edit";

type LocationState = {
  application?: Application;
};

export const ApplicationEditorPage = ({ mode }: { mode: Mode }) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const [applicationId, setApplicationId] = useState(state?.application?.id ?? "");
  const [name, setName] = useState(state?.application?.name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(state?.application?.websiteUrl ?? "");
  const [loading, setLoading] = useState(false);

  const loadApplication = async (id: string) => {
    setLoading(true);
    const response = await client.get<Application>(`/api/v1/admin/applications/${id}`);
    setApplicationId(response.data.id);
    setName(response.data.name);
    setWebsiteUrl(response.data.websiteUrl ?? "");
    setLoading(false);
  };

  useEffect(() => {
    if (mode === "edit" && params.id && !state?.application) {
      loadApplication(params.id);
    }
  }, [mode, params.id, state?.application]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    setLoading(true);
    if (mode === "create") {
      await client.post<Application>("/api/v1/admin/applications", {
        id: applicationId.trim() || undefined,
        name: name.trim(),
        websiteUrl: websiteUrl.trim() || undefined
      });
    } else if (params.id) {
      await client.put<Application>(`/api/v1/admin/applications/${params.id}`, {
        name: name.trim(),
        websiteUrl: websiteUrl.trim() || undefined
      });
    }
    setLoading(false);
    navigate("/applications");
  };

  const title = mode === "create" ? "New Application" : "Edit Application";

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <div className="muted">Define the tenant ID used for content.</div>
        </div>
        <button className="button secondary" type="button" onClick={() => navigate("/applications")}>
          Back
        </button>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        {mode === "create" && (
          <div className="input">
            <label>Application ID (optional)</label>
            <input
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              placeholder="UUID (leave empty to auto-generate)"
            />
          </div>
        )}
        {mode === "edit" && (
          <div className="input">
            <label>Application ID</label>
            <input value={applicationId} readOnly />
          </div>
        )}
        <div className="input">
          <label>Name</label>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="App name" />
        </div>
        <div className="input">
          <label>Website URL</label>
          <input
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="button" type="submit" disabled={loading || !name.trim()}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => navigate("/applications")}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
