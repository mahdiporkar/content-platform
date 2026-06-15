import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Image, Modal, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listAdminMedia, listMediaReferences, purgeMediaAsset, restoreMediaAsset } from "../../api/media";
import { useTenant } from "../../app/tenant";
import type { MediaAsset, MediaReference } from "../../types";
import { useI18n } from "../../i18n";

const toSizeLabel = (sizeBytes: number): string => {
  const mb = sizeBytes / 1024 / 1024;
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = sizeBytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

const purgeErrorMessage = (error: unknown): string => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string") {
    return data;
  }
  if (data && typeof data === "object") {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return "Failed to purge file.";
};

export const MediaSafetyPage = () => {
  const navigate = useNavigate();
  const { applicationId } = useTenant();
  const { t, v } = useI18n();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const [referencesOpen, setReferencesOpen] = useState(false);
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [references, setReferences] = useState<MediaReference[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const pageSize = 24;

  const fetchItems = useCallback(async () => {
    if (!applicationId) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const response = await listAdminMedia({
        applicationId,
        state: "TRASH",
        page: page - 1,
        size: pageSize
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setItems([]);
      setTotal(0);
      messageApi.error("Failed to load trash list.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, messageApi, page]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const openReferences = useCallback(
    async (asset: MediaAsset) => {
      if (!applicationId) {
        return;
      }
      setSelectedAsset(asset);
      setReferencesOpen(true);
      setReferencesLoading(true);
      setReferences([]);
      try {
        const data = await listMediaReferences(asset.id, applicationId);
        setReferences(data);
      } catch {
        messageApi.error("Failed to load references.");
      } finally {
        setReferencesLoading(false);
      }
    },
    [applicationId, messageApi]
  );

  const columns = useMemo<ColumnsType<MediaAsset>>(
    () => [
      {
        title: "Preview",
        key: "preview",
        width: 110,
        render: (_, asset) => {
          if (asset.kind === "image") {
            return (
              <Image
                src={asset.mediaUrl}
                alt={asset.originalName ?? asset.objectKey}
                width={72}
                height={48}
                style={{ objectFit: "cover", borderRadius: 6 }}
                preview={false}
              />
            );
          }
          if (asset.kind === "video") {
            return <video src={asset.mediaUrl} width={72} height={48} style={{ objectFit: "cover", borderRadius: 6 }} />;
          }
          return <Typography.Text type="secondary">{t("common.file")}</Typography.Text>;
        }
      },
      {
        title: "File",
        key: "name",
        render: (_, asset) => (
          <Space direction="vertical" size={2}>
            <Typography.Text>{asset.originalName || asset.objectKey.split("/").at(-1) || asset.objectKey}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {asset.objectKey}
            </Typography.Text>
          </Space>
        )
      },
      {
        title: "Type",
        dataIndex: "kind",
        width: 110,
        render: (value: MediaAsset["kind"]) => <Tag>{value.toUpperCase()}</Tag>
      },
      {
        title: "Size",
        dataIndex: "sizeBytes",
        width: 110,
        render: (value: number) => toSizeLabel(value)
      },
      {
        title: "Refs",
        dataIndex: "refCount",
        width: 90,
        render: (value?: number) => value ?? 0
      },
      {
        title: "Purge",
        dataIndex: "canPurge",
        width: 90,
        render: (value?: boolean) => (value ? <Tag color="green">{t("common.yes")}</Tag> : <Tag color="red">{t("common.no")}</Tag>)
      },
      {
        title: "Actions",
        key: "actions",
        width: 260,
        render: (_, asset) => (
          <Space size="small">
            <Button onClick={() => void openReferences(asset)}>{t("common.references")}</Button>
            <Button
              onClick={async () => {
                if (!applicationId) {
                  return;
                }
                try {
                  await restoreMediaAsset(asset.id, applicationId);
                  messageApi.success("File restored.");
                  await fetchItems();
                } catch {
                  messageApi.error("Failed to restore file.");
                }
              }}
            >
              {t("common.restore")}
            </Button>
            <Popconfirm
              title="Purge this file permanently?"
              description="This will physically delete object(s) from storage."
              okText="Purge"
              okButtonProps={{ danger: true }}
              disabled={!asset.canPurge}
              onConfirm={async () => {
                if (!applicationId) {
                  return;
                }
                try {
                  await purgeMediaAsset(asset.id, applicationId);
                  messageApi.success("File purged.");
                  await fetchItems();
                } catch (error) {
                  messageApi.error(purgeErrorMessage(error));
                }
              }}
            >
              <Button danger type="primary" disabled={!asset.canPurge}>
                {t("common.purge")}
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [applicationId, fetchItems, messageApi, openReferences, t]
  );

  const referenceColumns = useMemo<ColumnsType<MediaReference>>(
    () => [
      { title: "Type", dataIndex: "refType", width: 100 },
      { title: "Reference ID", dataIndex: "refId" },
      { title: "Field", dataIndex: "refField", width: 140 },
      { title: "Created At", dataIndex: "createdAt", width: 220 }
    ],
    []
  );

  return (
    <Card className="page-card">
      {contextHolder}
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Media Trash & Safety
          </Typography.Title>
          <Typography.Text type="secondary">
            Only super admins can physically purge files, and only when there are no references.
          </Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Space wrap>
          <Button onClick={() => navigate("/media")}>{t("common.back")}</Button>
          <Button onClick={() => void fetchItems()} loading={loading}>
            {t("common.refresh")}
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage) => setPage(nextPage)
        }}
      />

      <Modal
        open={referencesOpen}
        title={`References${selectedAsset ? ` - ${selectedAsset.originalName || selectedAsset.objectKey}` : ""}`}
        onCancel={() => setReferencesOpen(false)}
        footer={<Button onClick={() => setReferencesOpen(false)}>{t("common.close")}</Button>}
        width={960}
      >
        <Table
          rowKey="id"
          columns={referenceColumns}
          dataSource={references}
          loading={referencesLoading}
          pagination={false}
          locale={{ emptyText: t("common.noResults") }}
        />
      </Modal>
    </Card>
  );
};
