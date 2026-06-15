import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  Upload,
  message
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { UploadOutlined } from "@ant-design/icons";
import { type Dayjs } from "dayjs";
import axios from "axios";
import client from "../../api/client";
import { addMediaVariant, resolveMediaAssetByObjectKey } from "../../api/media";
import {
  ContentUsage,
  ImageContent,
  MediaAsset,
  MediaVariantDevice,
  MediaVariantPurpose,
  MediaVariantSizeKey
} from "../../types";
import { useTenant } from "../../app/tenant";
import { CONTENT_LOCALE_OPTIONS, DEFAULT_CONTENT_LOCALE, type ContentLocale } from "../../constants/locales";
import { MediaPickerModal } from "../../components/MediaPickerModal";
import { apiBaseUrl } from "../../config/env";
import { useI18n } from "../../i18n";

const resolveBackendOrigin = (): string => {
  const apiBase = apiBaseUrl.trim();
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
  const { t, v } = useI18n();
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
  const [messageApi, contextHolder] = message.useMessage();
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageItems, setUsageItems] = useState<ContentUsage[]>([]);
  const [usageTargetTitle, setUsageTargetTitle] = useState<string>("");
  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [variants, setVariants] = useState<
    Array<{
      file: File | null;
      purpose: MediaVariantPurpose;
      sizeKey?: MediaVariantSizeKey;
      device?: MediaVariantDevice;
    }>
  >([]);

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
      params: { applicationId, deleted: viewMode === "trash" }
    });
    setImages(response.data.items);
    setLoading(false);
  }, [applicationId, viewMode]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const openUsage = async (image: ImageContent) => {
    setUsageTargetTitle(image.title);
    setUsageOpen(true);
    setUsageLoading(true);
    setUsageItems([]);
    try {
      const response = await client.get<ContentUsage[]>(`/api/v1/admin/images/${image.id}/usages`);
      setUsageItems(response.data);
    } catch {
      messageApi.error("Failed to load usage list.");
    } finally {
      setUsageLoading(false);
    }
  };

  const handleDelete = async (image: ImageContent) => {
    try {
      await client.delete(`/api/v1/admin/images/${image.id}`);
      messageApi.success("Image record deleted.");
      await fetchImages();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const messageText =
          typeof error.response.data === "object" && error.response.data && "message" in error.response.data
            ? String((error.response.data as { message?: unknown }).message || "")
            : "";
        messageApi.warning(messageText || "This image cannot be deleted because its file is used in other content.");
        return;
      }
      messageApi.error("Failed to delete image.");
    }
  };

  const handleRestore = async (image: ImageContent) => {
    try {
      await client.post(`/api/v1/admin/images/${image.id}/restore`);
      messageApi.success("Image restored.");
      await fetchImages();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const messageText =
          typeof error.response?.data === "object" && error.response?.data && "message" in error.response.data
            ? String((error.response.data as { message?: unknown }).message || "")
            : "";
        messageApi.warning(messageText || "Failed to restore image.");
        return;
      }
      messageApi.error("Failed to restore image.");
    }
  };

  const openVariants = async (image: ImageContent) => {
    if (!applicationId) {
      return;
    }
    try {
      const asset = await resolveMediaAssetByObjectKey(image.objectKey, applicationId);
      navigate(`/media/${asset.id}/variants`);
    } catch {
      messageApi.error("Media asset not found for this image.");
    }
  };

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
    try {
      let createdObjectKey: string | null = null;
      if (selectedAsset) {
        const response = await client.post<{ objectKey: string }>("/api/v1/admin/images/create-from-asset", {
          assetId: selectedAsset.id,
          title: title.trim(),
          applicationId,
          status,
          locale,
          scheduledAt: status === "SCHEDULED" ? scheduledAtIso : undefined
        });
        createdObjectKey = response.data.objectKey;
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
        const response = await client.post<{ objectKey: string }>("/api/v1/admin/images/upload", payload, {
          headers: { "Content-Type": "multipart/form-data" }
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
      setUploadOpen(false);
      setFileList([]);
      setSelectedAsset(null);
      setVariants([]);
      setTitle("");
      setLocale(DEFAULT_CONTENT_LOCALE);
      setScheduledAt(null);
      await fetchImages();
    } catch {
      messageApi.error("Failed to create image or variants.");
    }
  };

  const addVariantRow = () => {
    setVariants((prev) => [...prev, { file: null, purpose: "thumbnail" }]);
  };

  const updateVariant = (
    index: number,
    patch: Partial<{ file: File | null; purpose: MediaVariantPurpose; sizeKey?: MediaVariantSizeKey; device?: MediaVariantDevice }>
  ) => {
    setVariants((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, ...patch } : entry)));
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
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
        width: "20%",
        render: (_, image) => (
          <Space size="small">
            <Button type="text" onClick={() => void openUsage(image)}>
              Usage
            </Button>
            {viewMode === "active" ? (
              <>
                <Button type="text" onClick={() => navigate(`/images/${image.id}`)}>
                  Edit
                </Button>
                <Button type="text" onClick={() => void openVariants(image)}>
                  Variants
                </Button>
                <Popconfirm
                  title="Delete this image record?"
                  description="The file remains in File Manager. Delete is blocked if the file is used elsewhere."
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => void handleDelete(image)}
                >
                  <Button danger type="text">
                    Delete
                  </Button>
                </Popconfirm>
              </>
            ) : (
              <Button type="text" onClick={() => void handleRestore(image)}>
                Restore
              </Button>
            )}
          </Space>
        )
      }
    ],
    [applicationId, handleDelete, handleRestore, messageApi, navigate, openUsage, viewMode]
  );

  const usageColumns = useMemo<ColumnsType<ContentUsage>>(
    () => [
      { title: "Type", dataIndex: "refType", width: 110 },
      {
        title: "Title",
        key: "title",
        render: (_, usage) => usage.title || usage.refId
      },
      { title: "Field", dataIndex: "refField", width: 120 },
      {
        title: "Open",
        key: "open",
        width: 110,
        render: (_, usage) => (
          <Button
            type="link"
            disabled={!usage.routePath}
            onClick={() => {
              if (!usage.routePath) {
                return;
              }
              setUsageOpen(false);
              navigate(usage.routePath);
            }}
          >
            Go
          </Button>
        )
      }
    ],
    [navigate]
  );

  return (
    <Card className="page-card">
      {contextHolder}
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Images
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.fileManagerDescription")}</Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Space>
          <Button type={viewMode === "active" ? "primary" : "default"} onClick={() => setViewMode("active")}>
            Images
          </Button>
          <Button type={viewMode === "trash" ? "primary" : "default"} onClick={() => setViewMode("trash")}>
            Trash
          </Button>
          <Button type="primary" onClick={() => setUploadOpen(true)} disabled={!applicationId || viewMode === "trash"}>
            Upload Image
          </Button>
        </Space>
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
          <Form.Item label={t("common.title")} required>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Form.Item>
          <Form.Item label={t("common.status")}>
            <Select
              value={status}
              onChange={(value) => setStatus(value)}
              options={[
                { value: "DRAFT", label: v("DRAFT") },
                { value: "PUBLISHED", label: v("PUBLISHED") },
                { value: "ARCHIVED", label: v("ARCHIVED") },
                { value: "SCHEDULED", label: v("SCHEDULED") }
              ]}
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
              <Button icon={<UploadOutlined />}>{t("common.file")}</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="Variants (mobile/tablet/desktop)">
            <Space direction="vertical" style={{ width: "100%" }}>
              {variants.map((variant, index) => (
                <Card key={index} size="small" style={{ background: "#fafafa" }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Space wrap>
                      <Button onClick={() => (document.getElementById(`image-variant-${index}`) as HTMLInputElement | null)?.click()}>
                        {variant.file ? "Change Variant File" : "Select Variant File"}
                      </Button>
                      <Typography.Text type="secondary">{variant.file?.name || "No file selected"}</Typography.Text>
                      <input
                        id={`image-variant-${index}`}
                        type="file"
                        accept="image/*"
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
      <Modal
        open={usageOpen}
        title={`Usage${usageTargetTitle ? ` - ${usageTargetTitle}` : ""}`}
        onCancel={() => setUsageOpen(false)}
        footer={<Button onClick={() => setUsageOpen(false)}>{t("common.close")}</Button>}
        width={900}
      >
        <Table
          rowKey={(row) => `${row.refType}-${row.refId}-${row.refField}`}
          dataSource={usageItems}
          columns={usageColumns}
          loading={usageLoading}
          pagination={false}
          locale={{ emptyText: "No usage found. This file is not used elsewhere." }}
        />
      </Modal>
    </Card>
  );
};
