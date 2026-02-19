import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Modal, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, PageResponse, Video } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];
const statusColors: Record<ContentStatus, "default" | "success" | "warning" | "processing"> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
  SCHEDULED: "processing"
};

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

const toGatewayMediaUrl = (video: Video): string => {
  const objectPath = video.objectKey.startsWith(`${video.applicationId}/`)
    ? video.objectKey.slice(video.applicationId.length + 1)
    : video.objectKey;
  const encodedPath = objectPath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${resolveBackendOrigin()}/media/${encodeURIComponent(video.applicationId)}/${encodedPath}`;
};

const toSameOriginMediaUrl = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (!parsed.pathname.startsWith("/media/")) {
      return null;
    }
    return `${window.location.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
};

export const VideoListPage = () => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

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
      {
        title: "Preview",
        key: "preview",
        width: "10%",
        render: (_, video) => {
          const previewUrl = video.mediaUrl ?? video.presignedUrl;
          if (!previewUrl) {
            return <Typography.Text type="secondary">-</Typography.Text>;
          }
          return (
            <Button
              type="link"
              onClick={() => {
                setActivePreviewUrl(null);
                setPreviewVideo(video);
              }}
            >
              Preview
            </Button>
          );
        }
      },
      { title: "Title", dataIndex: "title", width: "25%" },
      {
        title: "Status",
        dataIndex: "status",
        width: "12%",
        render: (value: ContentStatus) => <Tag color={statusColors[value]}>{value}</Tag>
      },
      {
        title: "File (Object Key)",
        dataIndex: "objectKey",
        width: "30%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        width: "13%",
        render: (value: string) => new Date(value).toLocaleString()
      },
      {
        title: "Actions",
        key: "actions",
        width: "10%",
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

      <Modal
        open={Boolean(previewVideo)}
        onCancel={() => {
          setPreviewVideo(null);
          setActivePreviewUrl(null);
        }}
        footer={null}
        title={previewVideo?.title ?? "Video Preview"}
        width={860}
        destroyOnHidden
      >
        {previewVideo ? (
          <video
            src={
              activePreviewUrl ??
              toSameOriginMediaUrl(previewVideo.mediaUrl ?? previewVideo.presignedUrl) ??
              previewVideo.mediaUrl ??
              previewVideo.presignedUrl ??
              toGatewayMediaUrl(previewVideo)
            }
            controls
            style={{ width: "100%", borderRadius: 8 }}
            onError={() => {
              if (!previewVideo) {
                return;
              }
              const sameOriginUrl = toSameOriginMediaUrl(previewVideo.mediaUrl ?? previewVideo.presignedUrl);
              if (sameOriginUrl && activePreviewUrl !== sameOriginUrl) {
                setActivePreviewUrl(sameOriginUrl);
                return;
              }
              const fallbackUrl = toGatewayMediaUrl(previewVideo);
              if (activePreviewUrl !== fallbackUrl) {
                setActivePreviewUrl(fallbackUrl);
              }
            }}
          />
        ) : (
          <Typography.Text type="secondary">Preview URL is not available for this video.</Typography.Text>
        )}
      </Modal>
    </Card>
  );
};
