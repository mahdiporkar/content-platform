import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, PageResponse, Post } from "../../types";
import { formatReadingTime, resolveReadingTimeMinutes } from "../../utils/readingTime";
import { useI18n } from "../../i18n";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];
const statusColors: Record<ContentStatus, "default" | "success" | "warning" | "processing"> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
  SCHEDULED: "processing"
};

export const PostsListPage = () => {
  const { applicationId } = useTenant();
  const { locale, t, v } = useI18n();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    if (!applicationId) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      const response = await client.get<PageResponse<Post>>("/api/v1/admin/posts", {
        params: { applicationId, status: status || undefined }
      });
      setPosts(response.data.items);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [applicationId, status]);

  const columns = useMemo<ColumnsType<Post>>(
    () => [
      { title: t("common.title"), dataIndex: "title", width: "30%" },
      {
        title: t("common.slug"),
        dataIndex: "slug",
        width: "21%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      {
        title: t("common.locale"),
        dataIndex: "locale",
        width: "9%",
        render: (value?: string | null) => value || "fa"
      },
      {
        title: t("common.readTime"),
        key: "readingTimeMinutes",
        width: "10%",
        render: (_, post) =>
          formatReadingTime(resolveReadingTimeMinutes(post.content, post.readingTimeMinutes))
      },
      {
        title: t("common.status"),
        dataIndex: "status",
        width: "12%",
        render: (value: ContentStatus) => <Tag color={statusColors[value]}>{v(value)}</Tag>
      },
      {
        title: t("common.updated"),
        dataIndex: "updatedAt",
        width: "13%",
        render: (value: string) => new Date(value).toLocaleString(locale)
      },
      {
        title: t("common.actions"),
        key: "actions",
        width: "10%",
        render: (_, post) => (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/posts/${post.id}`, { state: { post } })}
          >
            {t("common.edit")}
          </Button>
        )
      }
    ],
    [locale, navigate, t, v]
  );

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {t("page.posts")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.postsDescription")}</Typography.Text>
        </div>
      </div>

      <div className="page-actions">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/posts/new")}>
            {t("page.newPost")}
          </Button>
          <Select
            value={status || "ALL"}
            onChange={(value) => setStatus(value === "ALL" ? "" : (value as ContentStatus))}
            style={{ width: 150 }}
            options={[
              { label: t("common.allStatuses"), value: "ALL" },
              ...statusOptions.map((option) => ({ value: option, label: v(option) }))
            ]}
          />
        </Space>
        <Button icon={<ReloadOutlined />} onClick={fetchPosts} loading={loading}>
          {t("common.refresh")}
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={posts}
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{
          emptyText: (
            <div className="table-empty">
              <Typography.Text type="secondary">{t("common.noResults")}</Typography.Text>
              <div>
                <Button type="primary" onClick={() => navigate("/posts/new")}>
                  {t("page.createFirst")}
                </Button>
              </div>
            </div>
          )
        }}
      />
    </Card>
  );
};
