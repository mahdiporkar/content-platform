import React, { useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Typography } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import client from "../../api/client";
import { uploadMedia } from "../../api/media";
import { Article, ContentStatus, GalleryImage, SeoMeta } from "../../types";
import { ContentEditor } from "../../components/ContentEditor";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

type EditorMode = "create" | "edit";

type Props = {
  mode: EditorMode;
  applicationId: string;
  articleId?: string;
  initialArticle?: Article;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const ArticleEditorForm = ({
  mode,
  applicationId,
  articleId,
  initialArticle,
  onSuccess,
  onCancel
}: Props) => {
  const [title, setTitle] = useState(initialArticle?.title ?? "");
  const [slug, setSlug] = useState(initialArticle?.slug ?? "");
  const [content, setContent] = useState(initialArticle?.content ?? "");
  const [bannerUrl, setBannerUrl] = useState(initialArticle?.bannerUrl ?? "");
  const [tags, setTags] = useState<string[]>(initialArticle?.tags ?? []);
  const [seo, setSeo] = useState<SeoMeta>(initialArticle?.seo ?? {});
  const [gallery, setGallery] = useState<GalleryImage[]>(initialArticle?.gallery ?? []);
  const [status, setStatus] = useState<ContentStatus>(initialArticle?.status ?? "DRAFT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const tagsInput = useMemo(() => tags.join(", "), [tags]);

  const updateSeo = (key: keyof SeoMeta, value: string | boolean | string[]) => {
    setSeo((prev) => ({ ...prev, [key]: value }));
  };

  const updateGallery = (index: number, patch: Partial<GalleryImage>) => {
    setGallery((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addGalleryItem = () => {
    setGallery((prev) => [...prev, { url: "", alt: "", caption: "" }]);
  };

  const removeGalleryItem = (index: number) => {
    setGallery((prev) => prev.filter((_, idx) => idx !== index));
  };

  const subtitle = useMemo(
    () => (mode === "create" ? "Write a new article." : "Edit and publish long-form content."),
    [mode]
  );

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
    const payload = { applicationId, title, slug, content, status, bannerUrl, tags, seo, gallery };
    try {
      if (mode === "create") {
        await client.post("/api/v1/admin/articles", payload);
      } else if (articleId) {
        await client.put(`/api/v1/admin/articles/${articleId}`, payload);
      }
      onSuccess?.();
    } catch (err) {
      setError("Failed to save article. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {mode === "create" ? "Create Article" : "Edit Article"}
          </Typography.Title>
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        </div>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />}

      <Form layout="vertical">
        <Form.Item label="Title" required>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} size="large" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Slug" required>
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Status">
              <Select
                value={status}
                onChange={(value) => setStatus(value)}
                options={statusOptions.map((option) => ({ value: option, label: option }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Banner image">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Space>
              <Button
                icon={<UploadOutlined />}
                onClick={() => bannerInputRef.current?.click()}
                disabled={!applicationId || bannerUploading}
              >
                {bannerUploading ? "Uploading..." : "Upload"}
              </Button>
              {bannerUrl && (
                <Button danger icon={<DeleteOutlined />} onClick={() => setBannerUrl("")} />
              )}
            </Space>
            {bannerUrl && (
              <div className="banner-preview">
                <img src={bannerUrl} alt="Article banner preview" />
              </div>
            )}
            {bannerError && <Typography.Text type="danger">{bannerError}</Typography.Text>}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleBannerInputChange}
            />
            <Input
              placeholder="Or paste image URL"
              value={bannerUrl}
              onChange={(event) => setBannerUrl(event.target.value)}
            />
          </Space>
        </Form.Item>
        <Form.Item label="Content">
          <ContentEditor applicationId={applicationId} value={content} onChange={setContent} />
        </Form.Item>

        <Card size="small" title="Tags & Categories" style={{ marginBottom: 16 }}>
          <Form.Item label="Tags">
            <Input
              value={tagsInput}
              onChange={(event) =>
                setTags(
                  event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                )
              }
              placeholder="news, fintech, growth"
            />
          </Form.Item>
        </Card>

        <Card size="small" title="SEO" style={{ marginBottom: 16 }}>
          <Form.Item label="Meta title">
            <Input value={seo.metaTitle ?? ""} onChange={(event) => updateSeo("metaTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label="Meta description">
            <Input.TextArea
              value={seo.metaDescription ?? ""}
              onChange={(event) => updateSeo("metaDescription", event.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Meta keywords">
            <Input
              value={(seo.metaKeywords ?? []).join(", ")}
              onChange={(event) =>
                updateSeo(
                  "metaKeywords",
                  event.target.value
                    .split(",")
                    .map((keyword) => keyword.trim())
                    .filter(Boolean)
                )
              }
              placeholder="keyword1, keyword2"
            />
          </Form.Item>
          <Form.Item label="Canonical URL">
            <Input value={seo.canonicalUrl ?? ""} onChange={(event) => updateSeo("canonicalUrl", event.target.value)} />
          </Form.Item>
          <Form.Item label="Robots">
            <Space>
              <Button
                type={seo.noIndex ? "primary" : "default"}
                onClick={() => updateSeo("noIndex", !seo.noIndex)}
              >
                No index
              </Button>
              <Button
                type={seo.noFollow ? "primary" : "default"}
                onClick={() => updateSeo("noFollow", !seo.noFollow)}
              >
                No follow
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="Open Graph title">
            <Input value={seo.ogTitle ?? ""} onChange={(event) => updateSeo("ogTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label="Open Graph description">
            <Input.TextArea
              value={seo.ogDescription ?? ""}
              onChange={(event) => updateSeo("ogDescription", event.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Open Graph image URL">
            <Input value={seo.ogImage ?? ""} onChange={(event) => updateSeo("ogImage", event.target.value)} />
          </Form.Item>
          <Form.Item label="Twitter title">
            <Input value={seo.twitterTitle ?? ""} onChange={(event) => updateSeo("twitterTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label="Twitter description">
            <Input.TextArea
              value={seo.twitterDescription ?? ""}
              onChange={(event) => updateSeo("twitterDescription", event.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Twitter image URL">
            <Input value={seo.twitterImage ?? ""} onChange={(event) => updateSeo("twitterImage", event.target.value)} />
          </Form.Item>
          <Form.Item label="Schema JSON-LD">
            <Input.TextArea
              value={seo.schemaJsonLd ?? ""}
              onChange={(event) => updateSeo("schemaJsonLd", event.target.value)}
              rows={4}
            />
          </Form.Item>
        </Card>

        <Card size="small" title="Image Gallery" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Space>
              <Button onClick={() => galleryInputRef.current?.click()} disabled={!applicationId}>
                Upload image
              </Button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  try {
                    const response = await uploadMedia(file, applicationId, "image");
                    setGallery((prev) => [...prev, { url: response.url, alt: file.name, caption: "" }]);
                  } catch (uploadError) {
                    setError("Gallery upload failed. Try again.");
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
              <Button type="dashed" onClick={addGalleryItem}>
                Add Image
              </Button>
            </Space>
            {gallery.map((item, index) => (
              <Card key={`${item.url}-${index}`} size="small" style={{ background: "#fafafa" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Input
                    placeholder="Image URL"
                    value={item.url}
                    onChange={(event) => updateGallery(index, { url: event.target.value })}
                  />
                  <Input
                    placeholder="Alt text"
                    value={item.alt ?? ""}
                    onChange={(event) => updateGallery(index, { alt: event.target.value })}
                  />
                  <Input
                    placeholder="Caption"
                    value={item.caption ?? ""}
                    onChange={(event) => updateGallery(index, { caption: event.target.value })}
                  />
                  <Button danger onClick={() => removeGalleryItem(index)}>
                    Remove
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      </Form>

      <Space>
        <Button type="primary" onClick={handleSave} loading={saving} size="large">
          {saving ? "Saving..." : "Save Article"}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} disabled={saving} size="large">
            Cancel
          </Button>
        )}
      </Space>
    </Card>
  );
};
