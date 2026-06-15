import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Image, Input, Modal, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listMediaAssets, type MediaKind } from "../api/media";
import type { MediaAsset } from "../types";
import { useI18n } from "../i18n";

type Props = {
  open: boolean;
  applicationId: string;
  allowedKinds?: MediaKind[];
  title?: string;
  onCancel: () => void;
  onSelect: (asset: MediaAsset) => void;
};

const toSizeLabel = (sizeBytes: number): string => {
  const mb = sizeBytes / 1024 / 1024;
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = sizeBytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

export const MediaPickerModal = ({
  open,
  applicationId,
  allowedKinds = ["image", "video", "other"],
  title = "File Manager",
  onCancel,
  onSelect
}: Props) => {
  const { t, v } = useI18n();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<MediaKind | undefined>(
    allowedKinds.length === 1 ? allowedKinds[0] : undefined
  );
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    if (allowedKinds.length === 1) {
      setKind(allowedKinds[0]);
    } else if (kind && !allowedKinds.includes(kind)) {
      setKind(undefined);
    }
  }, [allowedKinds, kind]);

  const loadAssets = useCallback(async () => {
    if (!open || !applicationId) {
      return;
    }
    setLoading(true);
    try {
      const response = await listMediaAssets({
        applicationId,
        kind,
        search: search.trim() || undefined,
        page: page - 1,
        size: pageSize
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } finally {
      setLoading(false);
    }
  }, [open, applicationId, kind, search, page]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

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
            return (
              <video src={asset.mediaUrl} width={72} height={48} style={{ objectFit: "cover", borderRadius: 6 }} />
            );
          }
          return <Typography.Text type="secondary">{t("common.file")}</Typography.Text>;
        }
      },
      {
        title: t("common.name"),
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
        width: 90,
        render: (value: MediaKind) => <Tag>{v(value)}</Tag>
      },
      {
        title: t("common.size"),
        dataIndex: "sizeBytes",
        width: 110,
        render: (value: number) => toSizeLabel(value)
      },
      {
        title: t("common.actions"),
        key: "action",
        width: 100,
        render: (_, asset) => (
          <Button type="link" onClick={() => onSelect(asset)}>
            {t("common.create")}
          </Button>
        )
      }
    ],
    [onSelect, t, v]
  );

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={title}
      width={920}
      footer={null}
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space wrap>
          <Input.Search
            placeholder={t("common.search")}
            allowClear
            style={{ width: 300 }}
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            onSearch={() => void loadAssets()}
          />
          <Select
            allowClear={allowedKinds.length > 1}
            style={{ width: 160 }}
            placeholder={t("common.type")}
            value={kind}
            onChange={(value) => {
              setPage(1);
              setKind(value);
            }}
            options={allowedKinds.map((entry) => ({ value: entry, label: v(entry) }))}
          />
          <Button onClick={() => void loadAssets()} loading={loading}>
            {t("common.refresh")}
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (nextPage) => setPage(nextPage)
          }}
        />
      </Space>
    </Modal>
  );
};
