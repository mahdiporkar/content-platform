import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Image, Input, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listMediaAssets, type MediaKind } from "../../api/media";
import { useTenant } from "../../app/tenant";
import type { MediaAsset } from "../../types";

const toSizeLabel = (sizeBytes: number): string => {
  const mb = sizeBytes / 1024 / 1024;
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = sizeBytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

export const MediaLibraryPage = () => {
  const { applicationId } = useTenant();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
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
          return <Typography.Text type="secondary">FILE</Typography.Text>;
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
        render: (value: MediaKind) => <Tag>{value.toUpperCase()}</Tag>
      },
      {
        title: "Size",
        dataIndex: "sizeBytes",
        width: 120,
        render: (value: number) => toSizeLabel(value)
      },
      {
        title: "URL",
        dataIndex: "mediaUrl",
        width: 120,
        render: (value: string) => (
          <a href={value} target="_blank" rel="noreferrer">
            Open
          </a>
        )
      }
    ],
    []
  );

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            File Manager
          </Typography.Title>
          <Typography.Text type="secondary">
            Shared media library for the selected application.
          </Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Space wrap>
          <Input.Search
            placeholder="Search by filename or path"
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
            placeholder="Type"
            style={{ width: 160 }}
            value={kind}
            onChange={(value) => {
              setKind(value);
              setPage(1);
            }}
            options={[
              { value: "image", label: "Image" },
              { value: "video", label: "Video" },
              { value: "file", label: "File" }
            ]}
          />
          <Button onClick={() => void fetchItems()} loading={loading}>
            Refresh
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
