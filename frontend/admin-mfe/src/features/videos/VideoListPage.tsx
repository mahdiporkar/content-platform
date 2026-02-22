import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, ContentUsage, PageResponse, Video } from "../../types";

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
  const [messageApi, contextHolder] = message.useMessage();
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageItems, setUsageItems] = useState<ContentUsage[]>([]);
  const [usageTargetTitle, setUsageTargetTitle] = useState<string>("");
  const [viewMode, setViewMode] = useState<"active" | "trash">("active");

  const fetchVideos = async () => {
    if (!applicationId) {
      setVideos([]);
      return;
    }
    setLoading(true);
    const response = await client.get<PageResponse<Video>>("/api/v1/admin/videos", {
      params: { applicationId, status: status || undefined, deleted: viewMode === "trash" }
    });
    setVideos(response.data.items);
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [applicationId, status, viewMode]);

  const openUsage = async (video: Video) => {
    setUsageTargetTitle(video.title);
    setUsageOpen(true);
    setUsageLoading(true);
    setUsageItems([]);
    try {
      const response = await client.get<ContentUsage[]>(`/api/v1/admin/videos/${video.id}/usages`);
      setUsageItems(response.data);
    } catch {
      messageApi.error("Failed to load usage list.");
    } finally {
      setUsageLoading(false);
    }
  };

  const handleDelete = async (video: Video) => {
    try {
      await client.delete(`/api/v1/admin/videos/${video.id}`);
      messageApi.success("Video record deleted.");
      await fetchVideos();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const messageText =
          typeof error.response.data === "object" && error.response.data && "message" in error.response.data
            ? String((error.response.data as { message?: unknown }).message || "")
            : "";
        messageApi.warning(messageText || "This video cannot be deleted because its file is used in other content.");
        return;
      }
      messageApi.error("Failed to delete video.");
    }
  };

  const handleRestore = async (video: Video) => {
    try {
      await client.post(`/api/v1/admin/videos/${video.id}/restore`);
      messageApi.success("Video restored.");
      await fetchVideos();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const messageText =
          typeof error.response?.data === "object" && error.response?.data && "message" in error.response.data
            ? String((error.response.data as { message?: unknown }).message || "")
            : "";
        messageApi.warning(messageText || "Failed to restore video.");
        return;
      }
      messageApi.error("Failed to restore video.");
    }
  };

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
        title: "Locale",
        dataIndex: "locale",
        width: "8%",
        render: (value?: string | null) => value || "fa"
      },
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
        width: "22%",
        render: (_, video) => (
          <Space size="small">
            <Button type="text" onClick={() => void openUsage(video)}>
              Usage
            </Button>
            {viewMode === "active" ? (
              <>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/videos/${video.id}`, { state: { video } })}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete this video record?"
                  description="The file remains in File Manager. Delete is blocked if the file is used elsewhere."
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => void handleDelete(video)}
                >
                  <Button danger type="text">
                    Delete
                  </Button>
                </Popconfirm>
              </>
            ) : (
              <Button type="text" onClick={() => void handleRestore(video)}>
                Restore
              </Button>
            )}
          </Space>
        )
      }
    ],
    [handleDelete, handleRestore, navigate, openUsage, viewMode]
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
            Videos
          </Typography.Title>
          <Typography.Text type="secondary">Manage your video content and uploads.</Typography.Text>
        </div>
      </div>

      <div className="page-actions">
        <Space>
          <Button type={viewMode === "active" ? "primary" : "default"} onClick={() => setViewMode("active")}>
            Videos
          </Button>
          <Button type={viewMode === "trash" ? "primary" : "default"} onClick={() => setViewMode("trash")}>
            Trash
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/videos/upload")} disabled={viewMode === "trash"}>
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

      <Modal
        open={usageOpen}
        title={`Usage${usageTargetTitle ? ` - ${usageTargetTitle}` : ""}`}
        onCancel={() => setUsageOpen(false)}
        footer={<Button onClick={() => setUsageOpen(false)}>Close</Button>}
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
