import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, GalleryContent, PageResponse } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];
const statusColors: Record<ContentStatus, "default" | "success" | "warning" | "processing"> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
  SCHEDULED: "processing"
};

export const GalleriesListPage = () => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [galleries, setGalleries] = useState<GalleryContent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGalleries = async () => {
    if (!applicationId) {
      setGalleries([]);
      return;
    }
    setLoading(true);
    try {
      const response = await client.get<PageResponse<GalleryContent>>("/api/v1/admin/galleries", {
        params: { applicationId, status: status || undefined }
      });
      setGalleries(response.data.items);
    } catch {
      setGalleries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleries();
  }, [applicationId, status]);

  const columns = useMemo<ColumnsType<GalleryContent>>(
    () => [
      { title: "Title", dataIndex: "title", width: "30%" },
      {
        title: "Slug",
        dataIndex: "slug",
        width: "24%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      {
        title: "Images",
        key: "gallery",
        width: "10%",
        render: (_, gallery) => gallery.gallery?.length ?? 0
      },
      {
        title: "Status",
        dataIndex: "status",
        width: "12%",
        render: (value: ContentStatus) => <Tag color={statusColors[value]}>{value}</Tag>
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        width: "14%",
        render: (value: string) => new Date(value).toLocaleString()
      },
      {
        title: "Actions",
        key: "actions",
        width: "10%",
        render: (_, gallery) => (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/galleries/${gallery.id}`, { state: { gallery } })}
          >
            Edit
          </Button>
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
            Galleries
          </Typography.Title>
          <Typography.Text type="secondary">Manage published gallery content.</Typography.Text>
        </div>
      </div>

      <div className="page-actions">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/galleries/new")}>
            New Gallery
          </Button>
          <Select
            value={status || "ALL"}
            onChange={(value) => setStatus(value === "ALL" ? "" : (value as ContentStatus))}
            style={{ width: 150 }}
            options={[
              { label: "All Status", value: "ALL" },
              ...statusOptions.map((option) => ({ value: option, label: option }))
            ]}
          />
        </Space>
        <Button icon={<ReloadOutlined />} onClick={fetchGalleries} loading={loading}>
          Refresh
        </Button>
      </div>

      <Table rowKey="id" dataSource={galleries} columns={columns} loading={loading} pagination={false} />
    </Card>
  );
};
