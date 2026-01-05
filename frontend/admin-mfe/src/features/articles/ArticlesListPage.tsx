import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { Article, ContentStatus, PageResponse } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const statusColors: Record<ContentStatus, "default" | "success" | "warning"> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning"
};

export const ArticlesListPage = () => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArticles = async () => {
    if (!applicationId) {
      setArticles([]);
      return;
    }
    setLoading(true);
    const response = await client.get<PageResponse<Article>>("/api/v1/admin/articles", {
      params: { applicationId, status: status || undefined }
    });
    setArticles(response.data.items);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, [applicationId, status]);

  const columns = useMemo<ColumnsType<Article>>(
    () => [
      { title: "Title", dataIndex: "title", width: "30%" },
      {
        title: "Slug",
        dataIndex: "slug",
        width: "25%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      {
        title: "Status",
        dataIndex: "status",
        width: "15%",
        render: (value: ContentStatus) => <Tag color={statusColors[value]}>{value}</Tag>
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
        render: (_, article) => (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/articles/${article.id}`, { state: { article } })}
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
            Articles
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage your long-form articles and in-depth content.
          </Typography.Text>
        </div>
      </div>

      <div className="page-actions">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/articles/new")}>
            New Article
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
        <Button icon={<ReloadOutlined />} onClick={fetchArticles} loading={loading}>
          Refresh
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={articles}
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{
          emptyText: (
            <div className="table-empty">
              <Typography.Text type="secondary">No articles found</Typography.Text>
              <div>
                <Button type="primary" onClick={() => navigate("/articles/new")}>
                  Create your first article
                </Button>
              </div>
            </div>
          )
        }}
      />
    </Card>
  );
};
