import React, { useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Form, Input, Select, Space, Typography, Upload } from "antd";
import type { UploadFile } from "antd";
import { UploadOutlined, VideoCameraOutlined } from "@ant-design/icons";
import client from "../../api/client";
import { uploadMedia } from "../../api/media";
import { ContentStatus, GalleryImage, SeoMeta } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

type Props = {
  applicationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const VideoUploadForm = ({ applicationId, onSuccess, onCancel }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ContentStatus>("DRAFT");
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [seo, setSeo] = useState<SeoMeta>({});
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
    if (tags.length > 0) {
      payload.append("tags", JSON.stringify(tags));
    }
    if (Object.keys(seo).length > 0) {
      payload.append("seo", JSON.stringify(seo));
    }
    if (gallery.length > 0) {
      payload.append("gallery", JSON.stringify(gallery));
    }

    try {
      await client.post("/api/v1/admin/videos/upload", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFile(null);
      setFileList([]);
      onSuccess?.();
    } catch (err) {
      setError("Upload failed. Check the fields and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (nextFileList: UploadFile[]) => {
    const selected = nextFileList[0]?.originFileObj;
    setFile(selected ?? null);
    setFileList(nextFileList);
  };

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Upload Video
          </Typography.Title>
          <Typography.Text type="secondary">Upload and publish video content.</Typography.Text>
        </div>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />}

      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item label="Title" required>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} size="large" />
        </Form.Item>
        <Form.Item label="Description">
          <Input.TextArea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
        </Form.Item>
        <Form.Item label="Status">
          <Select
            value={status}
            onChange={(value) => setStatus(value)}
            options={statusOptions.map((option) => ({ value: option, label: option }))}
          />
        </Form.Item>
        <Form.Item
          label="Video File"
          required
          help="Maximum file size: 500MB. Supported formats: MP4, WebM, MOV"
        >
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
        <Button type="primary" onClick={handleUpload} loading={uploading} size="large" disabled={!file}>
          {uploading ? "Uploading..." : "Upload Video"}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} disabled={uploading} size="large">
            Cancel
          </Button>
        )}
      </Space>
    </Card>
  );
};
