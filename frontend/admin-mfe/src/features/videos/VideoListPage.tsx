import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, PageResponse, Video } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const statusColors: Record<ContentStatus, "default" | "success" | "warning"> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning"
};

export const VideoListPage = () => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVideos = async () => {
    if (!applicationId) {
      setVideos([]);
      return;
    }
    setLoading(true);
    const response = await client.get<PageResponse<Video>>("/api/v1/admin/videos", {
      params: { applicationId, status: status || undefined }
    });
    setVideos(response.data.items);
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [applicationId, status]);

  const columns = useMemo<ColumnsType<Video>>(
    () => [
      { title: "Title", dataIndex: "title", width: "35%" },
      {
        title: "Status",
        dataIndex: "status",
        width: "15%",
        render: (value: ContentStatus) => <Tag color={statusColors[value]}>{value}</Tag>
      },
      {
        title: "File (Object Key)",
        dataIndex: "objectKey",
        width: "35%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        width: "15%",
        render: (value: string) => new Date(value).toLocaleString()
      },
      {
        title: "Actions",
        key: "actions",
        width: "15%",
        render: (_, video) => (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/videos/${video.id}`, { state: { video } })}
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
            Videos
          </Typography.Title>
          <Typography.Text type="secondary">Manage your video content and uploads.</Typography.Text>
        </div>
      </div>

      <div className="page-actions">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/videos/upload")}>
            Upload Video
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
        <Button icon={<ReloadOutlined />} onClick={fetchVideos} loading={loading}>
          Refresh
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={videos}
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{
          emptyText: (
            <div className="table-empty">
              <Typography.Text type="secondary">No videos found</Typography.Text>
              <div>
                <Button type="primary" onClick={() => navigate("/videos/upload")}>
                  Upload your first video
                </Button>
              </div>
            </div>
          )
        }}
      />
    </Card>
  );
};
