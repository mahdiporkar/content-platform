import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, DatePicker, Form, Image, Input, Modal, Select, Space, Table, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { UploadOutlined } from "@ant-design/icons";
import { type Dayjs } from "dayjs";
import client from "../../api/client";
import { ImageContent, MediaAsset } from "../../types";
import { useTenant } from "../../app/tenant";
import { CONTENT_LOCALE_OPTIONS, DEFAULT_CONTENT_LOCALE, type ContentLocale } from "../../constants/locales";
import { MediaPickerModal } from "../../components/MediaPickerModal";

const resolveBackendOrigin = (): string => {
  const apiBase = (process.env.API_BASE_URL || "").trim();
  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    try {
      return new URL(apiBase).origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
};

const toGatewayMediaUrl = (image: ImageContent): string => {
  const objectPath = image.objectKey.startsWith(`${image.applicationId}/`)
    ? image.objectKey.slice(image.applicationId.length + 1)
    : image.objectKey;
  const encodedPath = objectPath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${resolveBackendOrigin()}/media/${encodeURIComponent(image.applicationId)}/${encodedPath}`;
};

export const ImagesListPage = () => {
  const navigate = useNavigate();
  const { applicationId } = useTenant();
  const [images, setImages] = useState<ImageContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED">("DRAFT");
  const [locale, setLocale] = useState<ContentLocale>(DEFAULT_CONTENT_LOCALE);
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  const scheduleLabelByLocale: Record<ContentLocale, string> = {
    fa: "زمان انتشار",
    en: "Publish datetime",
    ar: "وقت النشر",
    zh: "发布时间",
    ru: "Дата публикации"
  };

  const fetchImages = useCallback(async () => {
    if (!applicationId) {
      return;
    }
    setLoading(true);
    const response = await client.get<{ items: ImageContent[] }>("/api/v1/admin/images", {
      params: { applicationId }
    });
    setImages(response.data.items);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async () => {
    if (!applicationId || (!selectedAsset && fileList.length === 0) || !title.trim()) {
      return;
    }
    const scheduledAtIso = status === "SCHEDULED" && scheduledAt ? scheduledAt.toDate().toISOString() : null;
    if (status === "SCHEDULED" && !scheduledAtIso) {
      return;
    }
    if (status === "SCHEDULED" && scheduledAt && scheduledAt.valueOf() <= Date.now()) {
      return;
    }
    if (selectedAsset) {
      await client.post("/api/v1/admin/images/create-from-asset", {
        assetId: selectedAsset.id,
        title: title.trim(),
        applicationId,
        status,
        locale,
        scheduledAt: status === "SCHEDULED" ? scheduledAtIso : undefined
      });
    } else {
      const payload = new FormData();
      payload.append("file", fileList[0]);
      payload.append("title", title.trim());
      payload.append("applicationId", applicationId);
      payload.append("status", status);
      payload.append("locale", locale);
      if (status === "SCHEDULED" && scheduledAtIso) {
        payload.append("scheduledAt", scheduledAtIso);
      }
      await client.post("/api/v1/admin/images/upload", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }
    setUploadOpen(false);
    setFileList([]);
    setSelectedAsset(null);
    setTitle("");
    setLocale(DEFAULT_CONTENT_LOCALE);
    setScheduledAt(null);
    await fetchImages();
  };

  const columns = useMemo<ColumnsType<ImageContent>>(
    () => [
      {
        title: "Preview",
        key: "preview",
        width: "10%",
        render: (_, image) =>
          image.mediaUrl || image.objectKey ? (
            <Image
              src={image.mediaUrl ?? toGatewayMediaUrl(image)}
              fallback={toGatewayMediaUrl(image)}
              alt={image.altText ?? image.title}
              width={72}
              height={48}
              style={{ objectFit: "cover", borderRadius: 6 }}
              preview={{ mask: "Preview" }}
            />
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          )
      },
      { title: "Title", dataIndex: "title", width: "28%" },
      { title: "Locale", dataIndex: "locale", width: "8%", render: (value?: string | null) => value || "fa" },
      { title: "Status", dataIndex: "status", width: "12%" },
      { title: "Views", dataIndex: "viewCount", width: "8%" },
      {
        title: "Media",
        dataIndex: "mediaUrl",
        width: "20%",
        render: (value: string | undefined) =>
          value ? (
            <a href={value} target="_blank" rel="noopener noreferrer">
              Open
            </a>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          )
      },
      {
        title: "Actions",
        key: "actions",
        width: "14%",
        render: (_, image) => (
          <Space size="small">
            <Button type="text" onClick={() => navigate(`/images/${image.id}`)}>
              Edit
            </Button>
          </Space>
        )
      }
    ],
    [navigate]
  );

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Images
          </Typography.Title>
          <Typography.Text type="secondary">Upload and manage image assets.</Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Button type="primary" onClick={() => setUploadOpen(true)} disabled={!applicationId}>
          Upload Image
        </Button>
      </div>
      <Table rowKey="id" dataSource={images} columns={columns} loading={loading} pagination={false} />

      <Modal
        open={uploadOpen}
        onCancel={() => {
          setUploadOpen(false);
          setSelectedAsset(null);
          setFileList([]);
        }}
        onOk={handleUpload}
        okText="Upload"
        title="Upload Image"
      >
        <Form layout="vertical">
          <Form.Item label="Title" required>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Form.Item>
          <Form.Item label="Status">
            <Select
              value={status}
              onChange={(value) => setStatus(value)}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "PUBLISHED", label: "Published" },
                { value: "ARCHIVED", label: "Archived" },
                { value: "SCHEDULED", label: "Scheduled" }
              ]}
            />
          </Form.Item>
          <Form.Item label="Language" required>
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
          <Form.Item label="File" required>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button onClick={() => setPickerOpen(true)} disabled={!applicationId}>
                Choose from File Manager
              </Button>
              {selectedAsset && (
                <Typography.Text type="secondary">
                  Selected: {selectedAsset.originalName || selectedAsset.objectKey}
                </Typography.Text>
              )}
            </Space>
            <Upload
              beforeUpload={(file) => {
                setFileList([file]);
                setSelectedAsset(null);
                return false;
              }}
              onRemove={() => setFileList([])}
              fileList={fileList as any}
            >
              <Button icon={<UploadOutlined />}>Select file</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
      <MediaPickerModal
        open={pickerOpen}
        applicationId={applicationId || ""}
        allowedKinds={["image"]}
        title="Select image from File Manager"
        onCancel={() => setPickerOpen(false)}
        onSelect={(asset) => {
          setSelectedAsset(asset);
          setFileList([]);
          setPickerOpen(false);
        }}
      />
    </Card>
  );
};
