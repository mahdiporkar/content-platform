import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { Article, ContentStatus, PageResponse } from "../../types";
import { formatReadingTime, resolveReadingTimeMinutes } from "../../utils/readingTime";
import { useI18n } from "../../i18n";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];
const statusColors: Record<ContentStatus, "default" | "success" | "warning" | "processing"> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
  SCHEDULED: "processing"
};

export const ArticlesListPage = () => {
  const { applicationId } = useTenant();
  const { locale, t, v } = useI18n();
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
    try {
      const response = await client.get<PageResponse<Article>>("/api/v1/admin/articles", {
        params: { applicationId, status: status || undefined }
      });
      setArticles(response.data.items);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [applicationId, status]);

  const columns = useMemo<ColumnsType<Article>>(
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
        render: (_, article) =>
          formatReadingTime(resolveReadingTimeMinutes(article.content, article.readingTimeMinutes))
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
        render: (_, article) => (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/articles/${article.id}`, { state: { article } })}
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
            {t("page.articles")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("page.articlesDescription")}
          </Typography.Text>
        </div>
      </div>

      <div className="page-actions">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/articles/new")}>
            {t("page.newArticle")}
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
        <Button icon={<ReloadOutlined />} onClick={fetchArticles} loading={loading}>
          {t("common.refresh")}
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
              <Typography.Text type="secondary">{t("common.noResults")}</Typography.Text>
              <div>
                <Button type="primary" onClick={() => navigate("/articles/new")}>
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
