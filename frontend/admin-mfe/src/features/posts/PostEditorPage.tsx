import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, Post } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

type EditorMode = "create" | "edit";

export const PostEditorPage = ({ mode }: { mode: EditorMode }) => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const existingPost = useMemo(() => {
    return (location.state as { post?: Post } | undefined)?.post;
  }, [location.state]);

  const [title, setTitle] = useState(existingPost?.title ?? "");
  const [slug, setSlug] = useState(existingPost?.slug ?? "");
  const [content, setContent] = useState(existingPost?.content ?? "");
  const [status, setStatus] = useState<ContentStatus>(existingPost?.status ?? "DRAFT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!applicationId) {
      setError("Application ID is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = { applicationId, title, slug, content, status };
    try {
      if (mode === "create") {
        await client.post("/api/v1/admin/posts", payload);
      } else if (id) {
        await client.put(`/api/v1/admin/posts/${id}`, payload);
      }
      navigate("/posts");
    } catch (err) {
      setError("Failed to save post. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{mode === "create" ? "Create Post" : "Edit Post"}</h2>
          <div className="muted">Write short updates with a clean editorial workflow.</div>
        </div>
        <button className="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="card form-grid">
        {error && <div className="muted">{error}</div>}
        <div className="input">
          <label>Title</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="input">
          <label>Slug</label>
          <input value={slug} onChange={(event) => setSlug(event.target.value)} />
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
          <label>Content</label>
          <ReactQuill theme="snow" value={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
};
