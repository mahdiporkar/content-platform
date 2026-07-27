import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, DatePicker, Form, Input, Select, Space, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import client from "../../api/client";
import { resolveMediaAssetByObjectKey, uploadMedia } from "../../api/media";
import { ContentStatus, GalleryImage, SeoMeta, Video } from "../../types";
import { CONTENT_LOCALE_OPTIONS, DEFAULT_CONTENT_LOCALE, type ContentLocale } from "../../constants/locales";
import { useI18n } from "../../i18n";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];

export const VideoEditorPage = () => {
  const { t, v } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const existingVideo = useMemo(() => {
    return (location.state as { video?: Video } | undefined)?.video;
  }, [location.state]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<Video | null>(existingVideo ?? null);
  const [title, setTitle] = useState(existingVideo?.title ?? "");
  const [description, setDescription] = useState(existingVideo?.description ?? "");
  const [status, setStatus] = useState<ContentStatus>(existingVideo?.status ?? "DRAFT");
  const [locale, setLocale] = useState<ContentLocale>((existingVideo?.locale as ContentLocale) ?? DEFAULT_CONTENT_LOCALE);
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(existingVideo?.scheduledAt ? dayjs(existingVideo.scheduledAt) : null);
  const [tags, setTags] = useState<string[]>(existingVideo?.tags ?? []);
  const [seo, setSeo] = useState<SeoMeta>(existingVideo?.seo ?? {});
  const [gallery, setGallery] = useState<GalleryImage[]>(existingVideo?.gallery ?? []);
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

  const scheduleLabelByLocale: Record<ContentLocale, string> = {
    fa: "زمان انتشار",
    en: "Publish datetime",
    ar: "وقت النشر",
    zh: "发布时间",
    ru: "Дата публикации"
  };

  const applyVideo = (next: Video) => {
    setVideo(next);
    setTitle(next.title);
    setDescription(next.description ?? "");
    setStatus(next.status);
    setLocale((next.locale as ContentLocale) ?? DEFAULT_CONTENT_LOCALE);
    setScheduledAt(next.scheduledAt ? dayjs(next.scheduledAt) : null);
    setTags(next.tags ?? []);
    setSeo(next.seo ?? {});
    setGallery(next.gallery ?? []);
  };

  useEffect(() => {
    if (!id || existingVideo) {
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await client.get<Video>(`/api/v1/admin/videos/${id}`);
        applyVideo(response.data);
      } catch (err) {
        setError("Failed to load video details.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, existingVideo]);

  const handleSave = async () => {
    if (!id) {
      setError("Video ID is missing.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
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
    try {
      const normalizedGallery = gallery
        .map((item) => ({
          url: item.url.trim(),
          alt: item.alt?.trim() || undefined,
          caption: item.caption?.trim() || undefined
        }))
        .filter((item) => item.url.length > 0);

      const response = await client.put<Video>(`/api/v1/admin/videos/${id}`, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        locale,
        scheduledAt: status === "SCHEDULED" ? scheduledAtIso : undefined,
        tags,
        seo,
        gallery: normalizedGallery
      });
      applyVideo(response.data);
      navigate("/videos");
    } catch (err) {
      setError("Failed to update video. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = video?.mediaUrl ?? video?.presignedUrl ?? null;
  const openVariants = async () => {
    if (!video?.objectKey || !video.applicationId) {
      return;
    }
    try {
      const asset = await resolveMediaAssetByObjectKey(video.objectKey, video.applicationId);
      navigate(`/media/${asset.id}/variants`);
    } catch {
      setError("Media asset not found for this video.");
    }
  };

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Video Details
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.videosDescription")}</Typography.Text>
        </div>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />}

      {loading ? (
        <Typography.Text type="secondary">{t("editor.loading")}</Typography.Text>
      ) : (
        <Form layout="vertical" style={{ maxWidth: 720 }}>
          <Form.Item label={t("common.title")} required>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} size="large" />
          </Form.Item>
          <Form.Item label={t("common.description")}>
            <Input.TextArea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </Form.Item>
          <Form.Item label={t("common.status")}>
            <Select
              value={status}
              onChange={(value) => setStatus(value)}
              options={statusOptions.map((option) => ({ value: option, label: v(option) }))}
            />
          </Form.Item>
          <Form.Item label={t("common.language")} required>
            <Select value={locale} onChange={(value) => setLocale(value as ContentLocale)} options={CONTENT_LOCALE_OPTIONS} />
          </Form.Item>
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
              <Input
                value={seo.canonicalUrl ?? ""}
                onChange={(event) => updateSeo("canonicalUrl", event.target.value)}
              />
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
                <Button onClick={() => galleryInputRef.current?.click()} disabled={!video?.applicationId}>
                  Upload image
                </Button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file || !video?.applicationId) {
                      return;
                    }
                    try {
                      const response = await uploadMedia(file, video.applicationId, "image");
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
                      Remove
                    </Button>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>

          {previewUrl && (
            <Form.Item label="Preview">
              <video src={previewUrl} controls style={{ width: "100%", borderRadius: 8 }} />
            </Form.Item>
          )}

          {video && (
            <Form.Item label="File details">
              <Space direction="vertical">
                <Typography.Text>
                  Object Key: <Typography.Text code>{video.objectKey}</Typography.Text>
                </Typography.Text>
                <Typography.Text>
                  Content Type: <Typography.Text code>{video.contentType}</Typography.Text>
                </Typography.Text>
                <Typography.Text>
                  Size:{" "}
                  <Typography.Text code>
                    {(video.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </Typography.Text>
                </Typography.Text>
              </Space>
            </Form.Item>
          )}
        </Form>
      )}

      <Space>
          <Button onClick={() => void openVariants()} disabled={!video}>
            {t("common.variants")}
        </Button>
        <Button type="primary" onClick={handleSave} loading={saving} size="large" disabled={loading}>
          {t("common.save")}
        </Button>
        <Button onClick={() => navigate("/videos")} disabled={saving} size="large">
          {t("common.cancel")}
        </Button>
      </Space>
    </Card>
  );
};
