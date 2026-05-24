import React, { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import client from "../../api/client";
import { uploadMedia } from "../../api/media";
import { useTenant } from "../../app/tenant";
import { ContentStatus, GalleryContent, GalleryImage, SeoMeta } from "../../types";
import { CONTENT_LOCALE_OPTIONS, DEFAULT_CONTENT_LOCALE, type ContentLocale } from "../../constants/locales";
import { MediaPickerModal } from "../../components/MediaPickerModal";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];

type EditorMode = "create" | "edit";

export const GalleryEditorPage = ({ mode }: { mode: EditorMode }) => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const initialGallery = useMemo(() => {
    return (location.state as { gallery?: GalleryContent } | undefined)?.gallery;
  }, [location.state]);

  const [title, setTitle] = useState(initialGallery?.title ?? "");
  const [slug, setSlug] = useState(initialGallery?.slug ?? "");
  const [description, setDescription] = useState(initialGallery?.description ?? "");
  const [tags, setTags] = useState<string[]>(initialGallery?.tags ?? []);
  const [seo, setSeo] = useState<SeoMeta>(initialGallery?.seo ?? {});
  const [gallery, setGallery] = useState<GalleryImage[]>(initialGallery?.gallery ?? []);
  const [status, setStatus] = useState<ContentStatus>(initialGallery?.status ?? "DRAFT");
  const [locale, setLocale] = useState<ContentLocale>((initialGallery?.locale as ContentLocale) ?? DEFAULT_CONTENT_LOCALE);
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(initialGallery?.scheduledAt ? dayjs(initialGallery.scheduledAt) : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateGallery = (index: number, patch: Partial<GalleryImage>) => {
    setGallery((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addGalleryItem = () => {
    setGallery((prev) => [...prev, { url: "", alt: "", caption: "" }]);
  };

  const removeGalleryItem = (index: number) => {
    setGallery((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateSeo = (key: keyof SeoMeta, value: string | boolean | string[]) => {
    setSeo((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!applicationId) {
      setError("Application ID is required.");
      return;
    }
    const scheduledAtIso = status === "SCHEDULED" && scheduledAt ? scheduledAt.toDate().toISOString() : null;
    if (status === "SCHEDULED" && !scheduledAtIso) {
      setError("Please select publish datetime.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      applicationId,
      title,
      description,
      slug,
      status,
      locale,
      scheduledAt: status === "SCHEDULED" ? scheduledAtIso : undefined,
      tags,
      seo,
      gallery
    };
    try {
      if (mode === "create") {
        await client.post("/api/v1/admin/galleries", payload);
      } else if (id) {
        await client.put(`/api/v1/admin/galleries/${id}`, payload);
      }
      navigate("/galleries");
    } catch {
      setError("Failed to save gallery. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {mode === "create" ? "Create Gallery" : "Edit Gallery"}
          </Typography.Title>
          <Typography.Text type="secondary">Create a gallery content item from managed images.</Typography.Text>
        </div>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />}

      <Form layout="vertical">
        <Form.Item label="Title" required>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} size="large" />
        </Form.Item>
        <Form.Item label="Description">
          <Input.TextArea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Slug" required>
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Status">
              <Select value={status} onChange={(value) => setStatus(value)} options={statusOptions.map((option) => ({ value: option, label: option }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Language" required>
              <Select value={locale} onChange={(value) => setLocale(value as ContentLocale)} options={CONTENT_LOCALE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        {status === "SCHEDULED" && (
          <Form.Item label="Publish datetime" required>
            <DatePicker showTime={{ format: "HH:mm" }} value={scheduledAt} onChange={(value) => setScheduledAt(value)} style={{ width: "100%" }} />
          </Form.Item>
        )}

        <Card size="small" title="Gallery Images" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Space>
              <Button onClick={() => inputRef.current?.click()} disabled={!applicationId}>
                Upload image
              </Button>
              <Button onClick={() => setPickerOpen(true)} disabled={!applicationId}>
                Add from File Manager
              </Button>
              <Button type="dashed" onClick={addGalleryItem}>
                Add URL
              </Button>
              <input
                ref={inputRef}
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
                  } catch {
                    setError("Gallery upload failed. Try again.");
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
            </Space>
            {gallery.map((item, index) => (
              <Card key={`${item.url}-${index}`} size="small" style={{ background: "#fafafa" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {item.url && <img src={item.url} alt={item.alt || ""} style={{ width: 160, height: 100, objectFit: "cover" }} />}
                  <Input placeholder="Image URL" value={item.url} onChange={(event) => updateGallery(index, { url: event.target.value })} />
                  <Input placeholder="Alt text" value={item.alt ?? ""} onChange={(event) => updateGallery(index, { alt: event.target.value })} />
                  <Input placeholder="Caption" value={item.caption ?? ""} onChange={(event) => updateGallery(index, { caption: event.target.value })} />
                  <Button danger icon={<DeleteOutlined />} onClick={() => removeGalleryItem(index)}>
                    Remove
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        <Card size="small" title="Tags & SEO" style={{ marginBottom: 16 }}>
          <Form.Item label="Tags">
            <Select mode="tags" value={tags} onChange={(value) => setTags(value)} tokenSeparators={[","]} placeholder="Enter tags" />
          </Form.Item>
          <Form.Item label="Meta title">
            <Input value={seo.metaTitle ?? ""} onChange={(event) => updateSeo("metaTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label="Meta description">
            <Input.TextArea value={seo.metaDescription ?? ""} onChange={(event) => updateSeo("metaDescription", event.target.value)} rows={3} />
          </Form.Item>
        </Card>
      </Form>

      <Space>
        <Button type="primary" onClick={handleSave} loading={saving} size="large">
          {saving ? "Saving..." : "Save Gallery"}
        </Button>
        <Button onClick={() => navigate("/galleries")} disabled={saving} size="large">
          Cancel
        </Button>
      </Space>
      <MediaPickerModal
        open={pickerOpen}
        applicationId={applicationId}
        allowedKinds={["image"]}
        title="Select gallery image"
        onCancel={() => setPickerOpen(false)}
        onSelect={(asset) => {
          setGallery((prev) => [...prev, { url: asset.mediaUrl, alt: asset.originalName ?? "", caption: "" }]);
          setPickerOpen(false);
        }}
      />
    </Card>
  );
};
