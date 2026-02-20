import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Form, Input, Select, Space, Typography } from "antd";
import client from "../../api/client";
import { ImageContent } from "../../types";
import { CONTENT_LOCALE_OPTIONS, DEFAULT_CONTENT_LOCALE, type ContentLocale } from "../../constants/locales";
import { formatIsoToGregorianInput, formatIsoToJalaliInput, parseGregorianInputToIso, parseJalaliInputToIso } from "../../utils/scheduleDate";

export const ImageEditorPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [image, setImage] = useState<ImageContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [scheduledAtGregorian, setScheduledAtGregorian] = useState("");
  const [scheduledAtJalali, setScheduledAtJalali] = useState("");

  const loadImage = async (id: string) => {
    setLoading(true);
    const response = await client.get<ImageContent>(`/api/v1/admin/images/${id}`);
    setImage(response.data);
    setScheduledAtGregorian(formatIsoToGregorianInput(response.data.scheduledAt));
    setScheduledAtJalali(formatIsoToJalaliInput(response.data.scheduledAt));
    setLoading(false);
  };

  useEffect(() => {
    if (params.id) {
      loadImage(params.id);
    }
  }, [params.id]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!image || !params.id) {
      return;
    }
    const scheduledAtIso =
      image.status === "SCHEDULED"
        ? ((image.locale as ContentLocale) ?? DEFAULT_CONTENT_LOCALE) === "fa"
          ? parseJalaliInputToIso(scheduledAtJalali)
          : parseGregorianInputToIso(scheduledAtGregorian)
        : null;
    if (image.status === "SCHEDULED" && !scheduledAtIso) {
      return;
    }
    setLoading(true);
    await client.put(`/api/v1/admin/images/${params.id}`, {
      title: image.title,
      description: image.description ?? undefined,
      locale: image.locale ?? DEFAULT_CONTENT_LOCALE,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      altText: image.altText ?? undefined,
      tags: image.tags ?? undefined,
      seo: image.seo ?? undefined,
      gallery: image.gallery ?? undefined,
      status: image.status,
      scheduledAt: image.status === "SCHEDULED" ? scheduledAtIso ?? undefined : undefined
    });
    setLoading(false);
    navigate("/images");
  };

  if (!image) {
    return (
      <Card className="page-card">
        <Typography.Text type="secondary">Loading...</Typography.Text>
      </Card>
    );
  }

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Edit Image
          </Typography.Title>
          <Typography.Text type="secondary">Update image metadata and status.</Typography.Text>
        </div>
      </div>
      <Form layout="vertical" onSubmitCapture={handleSave} style={{ maxWidth: 600 }}>
        <Form.Item label="Title" required>
          <Input
            value={image.title}
            onChange={(event) => setImage({ ...image, title: event.target.value })}
          />
        </Form.Item>
        <Form.Item label="Description">
          <Input.TextArea
            value={image.description ?? ""}
            onChange={(event) => setImage({ ...image, description: event.target.value })}
            rows={3}
          />
        </Form.Item>
        <Form.Item label="Locale">
          <Select
            value={(image.locale as ContentLocale) ?? DEFAULT_CONTENT_LOCALE}
            onChange={(value) => setImage({ ...image, locale: value })}
            options={CONTENT_LOCALE_OPTIONS}
          />
        </Form.Item>
        <Form.Item label="Alt Text">
          <Input value={image.altText ?? ""} onChange={(event) => setImage({ ...image, altText: event.target.value })} />
        </Form.Item>
        <Form.Item label="Width">
          <Input
            value={image.width ?? ""}
            onChange={(event) => setImage({ ...image, width: Number(event.target.value) || null })}
          />
        </Form.Item>
        <Form.Item label="Height">
          <Input
            value={image.height ?? ""}
            onChange={(event) => setImage({ ...image, height: Number(event.target.value) || null })}
          />
        </Form.Item>
        <Form.Item label="Status">
          <Select
            value={image.status}
            onChange={(value) => setImage({ ...image, status: value })}
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
              { value: "ARCHIVED", label: "Archived" },
              { value: "SCHEDULED", label: "Scheduled" }
            ]}
          />
        </Form.Item>
        {image.status === "SCHEDULED" && (
          <Form.Item
            label={((image.locale as ContentLocale) ?? DEFAULT_CONTENT_LOCALE) === "fa" ? "زمان انتشار" : "Publish datetime"}
            required
            extra={((image.locale as ContentLocale) ?? DEFAULT_CONTENT_LOCALE) === "fa" ? "فرمت: 1405/01/15 14:30" : undefined}
          >
            {((image.locale as ContentLocale) ?? DEFAULT_CONTENT_LOCALE) === "fa" ? (
              <Input
                value={scheduledAtJalali}
                onChange={(event) => setScheduledAtJalali(event.target.value)}
                placeholder="1405/01/15 14:30"
              />
            ) : (
              <Input
                type="datetime-local"
                value={scheduledAtGregorian}
                onChange={(event) => setScheduledAtGregorian(event.target.value)}
              />
            )}
          </Form.Item>
        )}
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save
          </Button>
          <Button onClick={() => navigate("/images")}>Cancel</Button>
        </Space>
      </Form>
    </Card>
  );
};
