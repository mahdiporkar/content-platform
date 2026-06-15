import React, { useRef, useState } from "react";
import { Alert, Button, Card, DatePicker, Form, Input, Select, Space, Typography, Upload } from "antd";
import type { UploadFile } from "antd";
import { UploadOutlined, VideoCameraOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import client from "../../api/client";
import { addMediaVariant, resolveMediaAssetByObjectKey, uploadMedia } from "../../api/media";
import {
  ContentStatus,
  GalleryImage,
  MediaAsset,
  MediaVariantDevice,
  MediaVariantPurpose,
  MediaVariantSizeKey,
  SeoMeta
} from "../../types";
import { CONTENT_LOCALE_OPTIONS, DEFAULT_CONTENT_LOCALE, type ContentLocale } from "../../constants/locales";
import { MediaPickerModal } from "../../components/MediaPickerModal";
import { useI18n } from "../../i18n";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];

type Props = {
  applicationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type VariantDraft = {
  file: File | null;
  purpose: MediaVariantPurpose;
  sizeKey?: MediaVariantSizeKey;
  device?: MediaVariantDevice;
};

export const VideoUploadForm = ({ applicationId, onSuccess, onCancel }: Props) => {
  const { t, v } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ContentStatus>("DRAFT");
  const [locale, setLocale] = useState<ContentLocale>(DEFAULT_CONTENT_LOCALE);
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [seo, setSeo] = useState<SeoMeta>({});
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [selectedVideoAsset, setSelectedVideoAsset] = useState<MediaAsset | null>(null);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
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

  const handleUpload = async () => {
    if (!applicationId) {
      setError("Application ID is required.");
      return;
    }
    if (!file && !selectedVideoAsset) {
      setError("Choose a video file to upload.");
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
    setUploading(true);
    setError(null);
    try {
      let createdObjectKey: string | null = null;
      if (file) {
        const payload = new FormData();
        payload.append("file", file);
        payload.append("title", title);
        payload.append("description", description);
        payload.append("applicationId", applicationId);
        payload.append("status", status);
        payload.append("locale", locale);
        if (status === "SCHEDULED" && scheduledAtIso) {
          payload.append("scheduledAt", scheduledAtIso);
        }
        if (tags.length > 0) {
          payload.append("tags", JSON.stringify(tags));
        }
        if (Object.keys(seo).length > 0) {
          payload.append("seo", JSON.stringify(seo));
        }
        if (gallery.length > 0) {
          payload.append("gallery", JSON.stringify(gallery));
        }
        const response = await client.post<{ objectKey: string }>("/api/v1/admin/videos/upload", payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        createdObjectKey = response.data.objectKey;
      } else if (selectedVideoAsset) {
        const response = await client.post<{ objectKey: string }>("/api/v1/admin/videos/create-from-asset", {
          assetId: selectedVideoAsset.id,
          title,
          description,
          applicationId,
          status,
          locale,
          scheduledAt: status === "SCHEDULED" ? scheduledAtIso : undefined,
          tags,
          seo,
          gallery
        });
        createdObjectKey = response.data.objectKey;
      }

      if (createdObjectKey && variants.some((entry) => entry.file)) {
        const asset = await resolveMediaAssetByObjectKey(createdObjectKey, applicationId);
        const usedCombos = new Set<string>();
        for (const variant of variants) {
          if (!variant.file) {
            continue;
          }
          const combo = `${variant.purpose}|${variant.sizeKey || ""}|${variant.device || ""}`;
          if (usedCombos.has(combo)) {
            throw new Error("Duplicate variant combination.");
          }
          usedCombos.add(combo);
          await addMediaVariant(asset.id, applicationId, variant.file, {
            purpose: variant.purpose,
            sizeKey: variant.sizeKey,
            device: variant.device
          });
        }
      }

      setFile(null);
      setFileList([]);
      setSelectedVideoAsset(null);
      setVariants([]);
      onSuccess?.();
    } catch (err) {
      setError("Upload failed. Check fields/variant duplicates and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (nextFileList: UploadFile[]) => {
    const selected = nextFileList[0]?.originFileObj;
    setFile(selected ?? null);
    setFileList(nextFileList);
    if (selected) {
      setSelectedVideoAsset(null);
    }
  };

  const addVariantRow = () => {
    setVariants((prev) => [...prev, { file: null, purpose: "thumbnail" }]);
  };

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    setVariants((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, ...patch } : entry)));
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Upload Video
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.videosDescription")}</Typography.Text>
        </div>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />}

      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item label={t("common.title")} required>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} size="large" />
        </Form.Item>
        <Form.Item label={t("common.description")}>
          <Input.TextArea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
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
        <Form.Item
          label="Video File"
          required
          help="Maximum file size: 500MB. Supported formats: MP4, WebM, MOV"
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button onClick={() => setVideoPickerOpen(true)} disabled={!applicationId}>
              Choose from File Manager
            </Button>
            {selectedVideoAsset && (
              <Typography.Text type="secondary">
                Selected: {selectedVideoAsset.originalName || selectedVideoAsset.objectKey}
              </Typography.Text>
            )}
          </Space>
          <Upload
            beforeUpload={() => false}
            maxCount={1}
            accept="video/*"
            fileList={fileList}
            onChange={({ fileList }) => handleFileChange(fileList)}
          >
            <Button icon={<UploadOutlined />} size="large" block>
            {fileList.length === 0 ? "Select Video File" : "Change Video File"}
            </Button>
          </Upload>
          {fileList.length > 0 && (
            <Card size="small" className="upload-preview">
              <Space>
                <VideoCameraOutlined className="upload-preview__icon" />
                <div>
                  <Typography.Text strong>{fileList[0]?.name}</Typography.Text>
                  {typeof fileList[0]?.size === "number" && (
                    <Typography.Text type="secondary" className="upload-preview__meta">
                      {(fileList[0].size / 1024 / 1024).toFixed(2)} MB
                    </Typography.Text>
                  )}
                </div>
              </Space>
            </Card>
          )}
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
                    Remove
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
        <Card size="small" title="Variants (mobile/tablet/desktop)" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {variants.map((variant, index) => (
              <Card key={index} size="small" style={{ background: "#fafafa" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space wrap>
                    <Button onClick={() => (document.getElementById(`video-variant-${index}`) as HTMLInputElement | null)?.click()}>
                      {variant.file ? "Change Variant File" : "Select Variant File"}
                    </Button>
                    <Typography.Text type="secondary">{variant.file?.name || "No file selected"}</Typography.Text>
                    <input
                      id={`video-variant-${index}`}
                      type="file"
                      accept="video/*"
                      hidden
                      onChange={(event) => updateVariant(index, { file: event.target.files?.[0] || null })}
                    />
                  </Space>
                  <Space wrap>
                    <Select
                      value={variant.purpose}
                      style={{ width: 150 }}
                      onChange={(value) => updateVariant(index, { purpose: value as MediaVariantPurpose })}
                      options={[
                        { value: "thumbnail", label: "thumbnail" },
                        { value: "hero", label: "hero" },
                        { value: "cover", label: "cover" },
                        { value: "gallery", label: "gallery" },
                        { value: "og_image", label: "og_image" },
                        { value: "preview", label: "preview" }
                      ]}
                    />
                    <Select
                      allowClear
                      placeholder="size"
                      value={variant.sizeKey}
                      style={{ width: 120 }}
                      onChange={(value) => updateVariant(index, { sizeKey: value as MediaVariantSizeKey })}
                      options={["xs", "sm", "md", "lg", "xl"].map((entry) => ({ value: entry, label: entry }))}
                    />
                    <Select
                      allowClear
                      placeholder="device"
                      value={variant.device}
                      style={{ width: 140 }}
                      onChange={(value) => updateVariant(index, { device: value as MediaVariantDevice })}
                      options={["mobile", "tablet", "desktop"].map((entry) => ({ value: entry, label: entry }))}
                    />
                    <Button danger onClick={() => removeVariant(index)}>
                      Remove
                    </Button>
                  </Space>
                </Space>
              </Card>
            ))}
            <Button type="dashed" onClick={addVariantRow}>
              Add Variant
            </Button>
          </Space>
        </Card>
      </Form>

      <Space>
        <Button type="primary" onClick={handleUpload} loading={uploading} size="large" disabled={!file && !selectedVideoAsset}>
          {t("page.uploadVideo")}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} disabled={uploading} size="large">
            {t("common.cancel")}
          </Button>
        )}
      </Space>
      <MediaPickerModal
        open={videoPickerOpen}
        applicationId={applicationId}
        allowedKinds={["video"]}
        title="Select video from File Manager"
        onCancel={() => setVideoPickerOpen(false)}
        onSelect={(asset) => {
          setSelectedVideoAsset(asset);
          setFile(null);
          setFileList([]);
          setVideoPickerOpen(false);
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
