import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { Article, ContentStatus } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

type EditorMode = "create" | "edit";

export const ArticleEditorPage = ({ mode }: { mode: EditorMode }) => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const existingArticle = useMemo(() => {
    return (location.state as { article?: Article } | undefined)?.article;
  }, [location.state]);

  const [title, setTitle] = useState(existingArticle?.title ?? "");
  const [slug, setSlug] = useState(existingArticle?.slug ?? "");
  const [content, setContent] = useState(existingArticle?.content ?? "");
  const [status, setStatus] = useState<ContentStatus>(existingArticle?.status ?? "DRAFT");
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
        await client.post("/api/v1/admin/articles", payload);
      } else if (id) {
        await client.put(`/api/v1/admin/articles/${id}`, payload);
      }
      navigate("/articles");
    } catch (err) {
      setError("Failed to save article. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{mode === "create" ? "Create Article" : "Edit Article"}</h2>
          <div className="muted">Build long-form content with structure and tone.</div>
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
