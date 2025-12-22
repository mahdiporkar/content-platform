import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const VideoUploadPage = () => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ContentStatus>("DRAFT");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!applicationId) {
      setError("Application ID is required.");
      return;
    }
    if (!file) {
      setError("Choose a video file to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    const payload = new FormData();
    payload.append("file", file);
    payload.append("title", title);
    payload.append("description", description);
    payload.append("applicationId", applicationId);
    payload.append("status", status);

    try {
      await client.post("/api/v1/admin/videos/upload", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      navigate("/videos");
    } catch (err) {
      setError("Upload failed. Check the fields and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Upload Video</h2>
          <div className="muted">Store media in MinIO and publish on demand.</div>
        </div>
        <button className="button" onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div className="card form-grid">
        {error && <div className="muted">{error}</div>}
        <div className="input">
          <label>Title</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="input">
          <label>Description</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
        <div className="input">
          <label>Status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value as ContentStatus)}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="input">
          <label>Video File</label>
          <input type="file" accept="video/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </div>
      </div>
    </div>
  );
};
