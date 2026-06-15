import React, { useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Typography } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import client from "../../api/client";
import { uploadMedia } from "../../api/media";
import { Article, ContentStatus, GalleryImage, SeoMeta } from "../../types";
import { ContentEditor } from "../../components/ContentEditor";
import { CONTENT_LOCALE_OPTIONS, DEFAULT_CONTENT_LOCALE, type ContentLocale } from "../../constants/locales";
import { MediaPickerModal } from "../../components/MediaPickerModal";
import { formatReadingTime, resolveReadingTimeMinutes } from "../../utils/readingTime";
import { useI18n } from "../../i18n";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];

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
  const { t, v } = useI18n();
  const [title, setTitle] = useState(initialArticle?.title ?? "");
  const [slug, setSlug] = useState(initialArticle?.slug ?? "");
  const [description, setDescription] = useState(initialArticle?.description ?? "");
  const [content, setContent] = useState(initialArticle?.content ?? "");
  const [bannerUrl, setBannerUrl] = useState(initialArticle?.bannerUrl ?? "");
  const [tags, setTags] = useState<string[]>(initialArticle?.tags ?? []);
  const [seo, setSeo] = useState<SeoMeta>(initialArticle?.seo ?? {});
  const [gallery, setGallery] = useState<GalleryImage[]>(initialArticle?.gallery ?? []);
  const [status, setStatus] = useState<ContentStatus>(initialArticle?.status ?? "DRAFT");
  const [locale, setLocale] = useState<ContentLocale>((initialArticle?.locale as ContentLocale) ?? DEFAULT_CONTENT_LOCALE);
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(initialArticle?.scheduledAt ? dayjs(initialArticle.scheduledAt) : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
  const readingTimeText = useMemo(
    () => formatReadingTime(resolveReadingTimeMinutes(content, initialArticle?.readingTimeMinutes)),
    [content, initialArticle?.readingTimeMinutes]
  );

  const scheduleLabelByLocale: Record<ContentLocale, string> = {
    fa: "زمان انتشار",
    en: "Publish datetime",
    ar: "وقت النشر",
    zh: "发布时间",
    ru: "Дата публикации"
  };

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
    const scheduledAtIso = status === "SCHEDULED" && scheduledAt ? scheduledAt.toDate().toISOString() : null;
    if (status === "SCHEDULED" && !scheduledAtIso) {
      setError(locale === "fa" ? "زمان انتشار را انتخاب کنید." : "Please select publish datetime.");
      return;
    }
    if (status === "SCHEDULED" && scheduledAt && scheduledAt.valueOf() <= Date.now()) {
      setError(locale === "fa" ? "زمان انتشار باید در آینده باشد." : "Publish datetime must be in the future.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      applicationId,
      title,
      description,
      slug,
      content,
      status,
      locale,
      scheduledAt: status === "SCHEDULED" ? scheduledAtIso : undefined,
      bannerUrl,
      tags,
      seo,
      gallery
    };
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
            {mode === "create" ? `${t("common.create")} ${t("page.articles")}` : `${t("common.edit")} ${t("page.articles")}`}
          </Typography.Title>
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        </div>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />}

      <Form layout="vertical">
        <Form.Item label={t("common.title")} required>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} size="large" />
        </Form.Item>
        <Form.Item label={t("common.description")}>
          <Input.TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t("common.slug")} required>
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t("common.status")}>
              <Select
                value={status}
                onChange={(value) => setStatus(value)}
                options={statusOptions.map((option) => ({ value: option, label: v(option) }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t("common.language")} required>
              <Select value={locale} onChange={(value) => setLocale(value as ContentLocale)} options={CONTENT_LOCALE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        {status === "SCHEDULED" && (
          <Form.Item
            label={scheduleLabelByLocale[locale]}
            required
          >
            <DatePicker
              showTime={{ format: "HH:mm" }}
              value={scheduledAt}
              onChange={(value) => setScheduledAt(value)}
              format={locale === "fa" ? "YYYY/MM/DD HH:mm" : "YYYY-MM-DD HH:mm"}
              style={{ width: "100%" }}
            />
          </Form.Item>
        )}
        <Form.Item label={t("field.bannerImage")}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Space>
              <Button
                icon={<UploadOutlined />}
                onClick={() => bannerInputRef.current?.click()}
                disabled={!applicationId || bannerUploading}
              >
                {bannerUploading ? "Uploading..." : "Upload"}
              </Button>
              <Button onClick={() => setBannerPickerOpen(true)} disabled={!applicationId || bannerUploading}>
                Choose from File Manager
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
              placeholder={t("field.coverImage")}
              value={bannerUrl}
              onChange={(event) => setBannerUrl(event.target.value)}
            />
          </Space>
        </Form.Item>
        <Form.Item label={t("field.content")}>
          <ContentEditor applicationId={applicationId} value={content} onChange={setContent} />
        </Form.Item>
        <Form.Item label={t("field.readTime")}>
          <Typography.Text>{readingTimeText}</Typography.Text>
        </Form.Item>

        <Card size="small" title="Tags & Categories" style={{ marginBottom: 16 }}>
          <Form.Item label={t("field.tags")}>
            <Select
              mode="tags"
              value={tags}
              onChange={(value) => setTags(value)}
              tokenSeparators={[","]}
              placeholder={t("field.tags")}
            />
          </Form.Item>
        </Card>

        <Card size="small" title="SEO" style={{ marginBottom: 16 }}>
          <Form.Item label={t("field.metaTitle")}>
            <Input value={seo.metaTitle ?? ""} onChange={(event) => updateSeo("metaTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label={t("field.metaDescription")}>
            <Input.TextArea
              value={seo.metaDescription ?? ""}
              onChange={(event) => updateSeo("metaDescription", event.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label={t("field.metaKeywords")}>
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
              placeholder={t("field.metaKeywords")}
            />
          </Form.Item>
          <Form.Item label={t("field.canonicalUrl")}>
            <Input value={seo.canonicalUrl ?? ""} onChange={(event) => updateSeo("canonicalUrl", event.target.value)} />
          </Form.Item>
          <Form.Item label={t("field.robots")}>
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
          <Form.Item label={t("field.ogTitle")}>
            <Input value={seo.ogTitle ?? ""} onChange={(event) => updateSeo("ogTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label={t("field.ogDescription")}>
            <Input.TextArea
              value={seo.ogDescription ?? ""}
              onChange={(event) => updateSeo("ogDescription", event.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label={t("field.ogImage")}>
            <Input value={seo.ogImage ?? ""} onChange={(event) => updateSeo("ogImage", event.target.value)} />
          </Form.Item>
          <Form.Item label={t("field.twitterTitle")}>
            <Input value={seo.twitterTitle ?? ""} onChange={(event) => updateSeo("twitterTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label={t("field.twitterDescription")}>
            <Input.TextArea
              value={seo.twitterDescription ?? ""}
              onChange={(event) => updateSeo("twitterDescription", event.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label={t("field.twitterImage")}>
            <Input value={seo.twitterImage ?? ""} onChange={(event) => updateSeo("twitterImage", event.target.value)} />
          </Form.Item>
          <Form.Item label={t("field.schema")}>
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
              <Button onClick={() => setGalleryPickerOpen(true)} disabled={!applicationId}>
                Add from File Manager
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
                    placeholder={t("field.coverImage")}
                    value={item.url}
                    onChange={(event) => updateGallery(index, { url: event.target.value })}
                  />
                  <Input
                    placeholder={t("field.altText")}
                    value={item.alt ?? ""}
                    onChange={(event) => updateGallery(index, { alt: event.target.value })}
                  />
                  <Input
                    placeholder={t("common.description")}
                    value={item.caption ?? ""}
                    onChange={(event) => updateGallery(index, { caption: event.target.value })}
                  />
                  <Button danger onClick={() => removeGalleryItem(index)}>
                    {t("common.delete")}
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      </Form>

      <Space>
        <Button type="primary" onClick={handleSave} loading={saving} size="large">
          {t("common.save")}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} disabled={saving} size="large">
            {t("common.cancel")}
          </Button>
        )}
      </Space>
      <MediaPickerModal
        open={bannerPickerOpen}
        applicationId={applicationId}
        allowedKinds={["image"]}
        title="Select banner image"
        onCancel={() => setBannerPickerOpen(false)}
        onSelect={(asset) => {
          setBannerUrl(asset.mediaUrl);
          setBannerPickerOpen(false);
        }}
      />
      <MediaPickerModal
        open={galleryPickerOpen}
        applicationId={applicationId}
        allowedKinds={["image"]}
        title="Select gallery image"
        onCancel={() => setGalleryPickerOpen(false)}
        onSelect={(asset) => {
          setGallery((prev) => [...prev, { url: asset.mediaUrl, alt: asset.originalName ?? "", caption: "" }]);
          setGalleryPickerOpen(false);
        }}
      />
    </Card>
  );
};
