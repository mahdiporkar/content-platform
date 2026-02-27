import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Form, InputNumber, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, useParams } from "react-router-dom";
import {
  addMediaVariant,
  deleteMediaVariant,
  listMediaVariants,
  replaceMediaVariant
} from "../../api/media";
import { useTenant } from "../../app/tenant";
import type { MediaVariant, MediaVariantDevice, MediaVariantPurpose, MediaVariantSizeKey } from "../../types";

const PURPOSE_OPTIONS: MediaVariantPurpose[] = [
  "default",
  "thumbnail",
  "hero",
  "cover",
  "gallery",
  "og_image",
  "preview"
];
const SIZE_OPTIONS: MediaVariantSizeKey[] = ["xs", "sm", "md", "lg", "xl"];
const DEVICE_OPTIONS: MediaVariantDevice[] = ["mobile", "tablet", "desktop"];

export const MediaVariantsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mediaId = id || "";
  const { applicationId } = useTenant();
  const [messageApi, contextHolder] = message.useMessage();
  const [variants, setVariants] = useState<MediaVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [purpose, setPurpose] = useState<MediaVariantPurpose>("thumbnail");
  const [sizeKey, setSizeKey] = useState<MediaVariantSizeKey | undefined>(undefined);
  const [device, setDevice] = useState<MediaVariantDevice | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const loadVariants = async () => {
    if (!applicationId || !mediaId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listMediaVariants(mediaId, applicationId);
      setVariants(data);
    } catch {
      setError("Failed to load variants.");
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVariants();
  }, [applicationId, mediaId]);

  const isDuplicate = useMemo(() => {
    return variants.some(
      (entry) =>
        entry.purpose === purpose &&
        (entry.sizeKey || null) === (sizeKey || null) &&
        (entry.device || null) === (device || null)
    );
  }, [variants, purpose, sizeKey, device]);

  const addVariant = async () => {
    if (!applicationId || !mediaId || !uploadFile) {
      return;
    }
    if (isDuplicate) {
      setError("Duplicate purpose/size/device is not allowed.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addMediaVariant(mediaId, applicationId, uploadFile, {
        purpose,
        sizeKey,
        device,
        sortOrder
      });
      setUploadFile(null);
      if (uploadRef.current) {
        uploadRef.current.value = "";
      }
      setPurpose("thumbnail");
      setSizeKey(undefined);
      setDevice(undefined);
      setSortOrder(0);
      messageApi.success("Variant added.");
      await loadVariants();
    } catch {
      setError("Failed to add variant.");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnsType<MediaVariant>>(
    () => [
      {
        title: "Preview",
        key: "preview",
        width: 110,
        render: (_, entry) => {
          const isVideo = (entry.format || "").toLowerCase().includes("mp4") || entry.url.includes("/video/");
          if (isVideo) {
            return <video src={entry.url} width={72} height={48} style={{ objectFit: "cover", borderRadius: 6 }} />;
          }
          return (
            <img
              src={entry.url}
              width={72}
              height={48}
              style={{ objectFit: "cover", borderRadius: 6 }}
              alt={entry.purpose}
            />
          );
        }
      },
      {
        title: "Purpose",
        dataIndex: "purpose",
        width: 120,
        render: (value: string, row) => (
          <Space>
            <Tag>{value}</Tag>
            {row.isDefault && <Tag color="blue">DEFAULT</Tag>}
          </Space>
        )
      },
      {
        title: "Size",
        dataIndex: "sizeKey",
        width: 90,
        render: (value?: string | null) => value || "-"
      },
      {
        title: "Device",
        dataIndex: "device",
        width: 100,
        render: (value?: string | null) => value || "-"
      },
      {
        title: "Dimensions",
        key: "dim",
        width: 120,
        render: (_, row) => (row.width && row.height ? `${row.width}x${row.height}` : "-")
      },
      {
        title: "Order",
        dataIndex: "sortOrder",
        width: 80
      },
      {
        title: "Created",
        dataIndex: "createdAt",
        width: 170,
        render: (value: string) => new Date(value).toLocaleString()
      },
      {
        title: "Actions",
        key: "actions",
        width: 220,
        render: (_, row) => (
          <Space>
            <Button
              onClick={() => window.open(row.url, "_blank")}
            >
              Preview
            </Button>
            <Button
              onClick={() => {
                uploadRef.current?.click();
                uploadRef.current?.setAttribute("data-replace-id", row.id);
              }}
            >
              Replace
            </Button>
            <Popconfirm
              title="Delete this variant?"
              onConfirm={async () => {
                if (!applicationId) {
                  return;
                }
                try {
                  await deleteMediaVariant(mediaId, row.id, applicationId);
                  messageApi.success("Variant deleted.");
                  await loadVariants();
                } catch (err) {
                  messageApi.error("Cannot delete variant (default protection may apply).");
                }
              }}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [applicationId, mediaId, messageApi]
  );

  return (
    <Card className="page-card">
      {contextHolder}
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Media Variants
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage art-direction variants for this media item.
          </Typography.Text>
        </div>
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      <Card size="small" title="Add Variant" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Space wrap style={{ width: "100%" }}>
            <Form.Item label="File" required>
              <Space>
                <Button onClick={() => uploadRef.current?.click()}>Choose File</Button>
                <Typography.Text type="secondary">{uploadFile?.name || "No file selected"}</Typography.Text>
              </Space>
              <input
                ref={uploadRef}
                type="file"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  const replaceId = event.currentTarget.getAttribute("data-replace-id");
                  if (replaceId && file && applicationId) {
                    try {
                      await replaceMediaVariant(
                        mediaId,
                        replaceId,
                        applicationId,
                        {},
                        file
                      );
                      messageApi.success("Variant file replaced.");
                      await loadVariants();
                    } catch {
                      messageApi.error("Failed to replace variant.");
                    } finally {
                      event.currentTarget.removeAttribute("data-replace-id");
                      event.currentTarget.value = "";
                    }
                    return;
                  }
                  setUploadFile(file || null);
                }}
              />
            </Form.Item>
            <Form.Item label="Purpose">
              <Select
                value={purpose}
                style={{ width: 150 }}
                onChange={(value) => setPurpose(value as MediaVariantPurpose)}
                options={PURPOSE_OPTIONS.map((entry) => ({ label: entry, value: entry }))}
              />
            </Form.Item>
            <Form.Item label="Size">
              <Select
                allowClear
                value={sizeKey}
                style={{ width: 120 }}
                onChange={(value) => setSizeKey(value as MediaVariantSizeKey)}
                options={SIZE_OPTIONS.map((entry) => ({ label: entry, value: entry }))}
              />
            </Form.Item>
            <Form.Item label="Device">
              <Select
                allowClear
                value={device}
                style={{ width: 140 }}
                onChange={(value) => setDevice(value as MediaVariantDevice)}
                options={DEVICE_OPTIONS.map((entry) => ({ label: entry, value: entry }))}
              />
            </Form.Item>
            <Form.Item label="Sort order">
              <InputNumber min={0} value={sortOrder} onChange={(value) => setSortOrder(value || 0)} />
            </Form.Item>
          </Space>
          <Space>
            <Button type="primary" onClick={addVariant} loading={saving} disabled={!uploadFile}>
              Add variant
            </Button>
            <Button onClick={() => navigate("/media")}>Back</Button>
          </Space>
        </Form>
      </Card>

      <Table rowKey="id" dataSource={variants} columns={columns} loading={loading} pagination={false} />
    </Card>
  );
};
