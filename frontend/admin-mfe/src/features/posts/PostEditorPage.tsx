import React, { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import client from "../../api/client";
import { uploadMedia } from "../../api/media";
import { useTenant } from "../../app/tenant";
import { ContentStatus, Post } from "../../types";
import { ContentEditor } from "../../components/ContentEditor";

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
  const [bannerUrl, setBannerUrl] = useState(existingPost?.bannerUrl ?? "");
  const [status, setStatus] = useState<ContentStatus>(existingPost?.status ?? "DRAFT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleBannerUpload = async (file: File) => {
    if (!applicationId) {
      setBannerError("Application ID is required before uploading media.");
      return;
    }
    setBannerUploading(true);
    setBannerError(null);
    try {
      const response = await uploadMedia(file, applicationId, "image");
      setBannerUrl(response.url);
    } catch (uploadError) {
      setBannerError("Banner upload failed. Try again.");
    } finally {
      setBannerUploading(false);
    }
  };

  const handleBannerInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleBannerUpload(file);
    }
    event.target.value = "";
  };

  const handleSave = async () => {
    if (!applicationId) {
      setError("Application ID is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = { applicationId, title, slug, content, status, bannerUrl };
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
          <label>Banner image</label>
          <div className="banner-card">
            <div className="banner-header">
              <div>
                <div className="banner-title">Cover for listings</div>
                <div className="muted">Upload a wide image for the post banner.</div>
              </div>
              <button
                className="button secondary"
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={!applicationId || bannerUploading}
              >
                {bannerUploading ? "Uploading..." : "Upload banner"}
              </button>
            </div>
            {bannerUrl ? (
              <div className="banner-preview">
                <img src={bannerUrl} alt="Post banner preview" />
                <div className="banner-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={!applicationId || bannerUploading}
                  >
                    Replace
                  </button>
                  <button type="button" className="button ghost" onClick={() => setBannerUrl("")}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="banner-empty">No banner yet. Upload an image to set the tone.</div>
            )}
            {bannerError && <div className="muted">{bannerError}</div>}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleBannerInputChange}
            />
            <div className="banner-url">
              <label>Or paste image URL</label>
              <input
                placeholder="https://..."
                value={bannerUrl}
                onChange={(event) => setBannerUrl(event.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="input">
          <label>Content</label>
          <ContentEditor applicationId={applicationId} value={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
};
