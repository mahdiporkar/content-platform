import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Image, Input, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { listMediaAssets, trashMediaAsset, type MediaKind } from "../../api/media";
import { useTenant } from "../../app/tenant";
import type { MediaAsset } from "../../types";
import { useI18n } from "../../i18n";

const toSizeLabel = (sizeBytes: number): string => {
  const mb = sizeBytes / 1024 / 1024;
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = sizeBytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

export const MediaLibraryPage = () => {
  const navigate = useNavigate();
  const { applicationId } = useTenant();
  const { t, v } = useI18n();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<MediaKind | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 24;

  const fetchItems = useCallback(async () => {
    if (!applicationId) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const response = await listMediaAssets({
        applicationId,
        kind,
        state: "ACTIVE",
        search: search.trim() || undefined,
        page: page - 1,
        size: pageSize
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } finally {
      setLoading(false);
    }
  }, [applicationId, kind, page, search]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const columns = useMemo<ColumnsType<MediaAsset>>(
    () => [
      {
        title: t("common.preview"),
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
        title: t("common.file"),
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
        title: t("common.type"),
        dataIndex: "kind",
        width: 110,
        render: (value: MediaKind) => <Tag>{v(value)}</Tag>
      },
      {
        title: t("common.status"),
        dataIndex: "state",
        width: 110,
        render: (value?: MediaAsset["state"]) => {
          const state = value ?? "ACTIVE";
          const color = state === "ACTIVE" ? "green" : state === "TRASH" ? "orange" : "red";
          return <Tag color={color}>{v(state)}</Tag>;
        }
      },
      {
        title: t("common.size"),
        dataIndex: "sizeBytes",
        width: 120,
        render: (value: number) => toSizeLabel(value)
      },
      {
        title: t("common.url"),
        dataIndex: "mediaUrl",
        width: 120,
        render: (value: string) => (
          <a href={value} target="_blank" rel="noreferrer">
            {t("common.open")}
          </a>
        )
      },
      {
        title: t("common.actions"),
        key: "actions",
        width: 220,
        render: (_, asset) => {
          const isStateLocked = asset.state === "TRASH" || asset.state === "PURGED";
          const trashDisabled = isStateLocked;
          const trashDisabledReason = asset.state === "TRASH"
              ? "This file is already in trash."
              : asset.state === "PURGED"
                ? "This file is already purged."
                : undefined;

          const button = (
            <Button danger type="text" disabled={trashDisabled} title={trashDisabledReason}>
              {t("common.trash")}
            </Button>
          );

          if (trashDisabled) {
            return (
              <Space>
                <Button type="text" onClick={() => navigate(`/media/${asset.id}/variants`)}>
                  {t("common.variants")}
                </Button>
                {button}
              </Space>
            );
          }

          return (
            <Space>
              <Button type="text" onClick={() => navigate(`/media/${asset.id}/variants`)}>
                {t("common.variants")}
              </Button>
              <Popconfirm
                title="Move this file to trash?"
                okText={t("common.trash")}
                cancelText={t("common.cancel")}
                okButtonProps={{ danger: true }}
                onConfirm={async () => {
                  if (!applicationId) {
                    return;
                  }
                  try {
                    await trashMediaAsset(asset.id, applicationId);
                    messageApi.success("File moved to trash.");
                    await fetchItems();
                  } catch (error) {
                    if (axios.isAxiosError(error) && error.response?.status === 409) {
                      messageApi.warning(
                        "This file is used in content (even DRAFT items count as usage) and cannot be moved to trash."
                      );
                      await fetchItems();
                      return;
                    }
                    messageApi.error("Failed to move file to trash.");
                  }
                }}
              >
                {button}
              </Popconfirm>
            </Space>
          );
        }
      }
    ],
    [applicationId, fetchItems, messageApi, navigate, t, v]
  );

  return (
    <Card className="page-card">
      {contextHolder}
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {t("page.fileManager")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("page.fileManagerDescription")}
          </Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Space wrap>
          <Button onClick={() => navigate("/media/safety")}>{t("page.trashSafety")}</Button>
          <Input.Search
            placeholder={t("common.search")}
            allowClear
            style={{ width: 320 }}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onSearch={() => void fetchItems()}
          />
          <Select
            allowClear
            placeholder={t("common.type")}
            style={{ width: 160 }}
            value={kind}
            onChange={(value) => {
              setKind(value);
              setPage(1);
            }}
            options={[
              { value: "image", label: v("image") },
              { value: "video", label: v("video") },
              { value: "other", label: v("other") }
            ]}
          />
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
    </Card>
  );
};
