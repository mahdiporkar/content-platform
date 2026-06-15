import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, DynamicPage, PageResponse } from "../../types";
import { CONTENT_LOCALE_OPTIONS } from "../../constants/locales";
import { useI18n } from "../../i18n";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const statusColors: Record<ContentStatus, "default" | "success" | "warning" | "processing"> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
  SCHEDULED: "processing"
};

export const PagesListPage = () => {
  const { applicationId } = useTenant();
  const { locale, t, v } = useI18n();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [languageCode, setLanguageCode] = useState<string>("");
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPages = async () => {
    if (!applicationId) {
      setPages([]);
      return;
    }
    setLoading(true);
    try {
      const response = await client.get<PageResponse<DynamicPage>>("/api/v1/admin/pages", {
        params: { applicationId, status: status || undefined, languageCode: languageCode || undefined }
      });
      setPages(response.data.items);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPages();
  }, [applicationId, status, languageCode]);

  const columns = useMemo<ColumnsType<DynamicPage>>(
    () => [
      { title: t("common.title"), dataIndex: "title", width: "28%" },
      {
        title: t("common.slug"),
        dataIndex: "slug",
        width: "22%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      { title: t("common.language"), dataIndex: "languageCode", width: "10%" },
      {
        title: t("menu.menus"),
        dataIndex: "showInMenu",
        width: "10%",
        render: (value: boolean) => (value ? <Tag color="blue">{t("common.visible")}</Tag> : <Tag>{t("common.hidden")}</Tag>)
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
        render: (_, page) => (
          <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/pages/${page.id}`, { state: { page } })}>
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
            {t("page.pages")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.pagesDescription")}</Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/pages/new")}>
            {t("page.newPage")}
          </Button>
          <Select
            value={status || "ALL"}
            onChange={(value) => setStatus(value === "ALL" ? "" : (value as ContentStatus))}
            style={{ width: 150 }}
            options={[{ label: t("common.allStatuses"), value: "ALL" }, ...statusOptions.map((option) => ({ value: option, label: v(option) }))]}
          />
          <Select
            value={languageCode || "ALL"}
            onChange={(value) => setLanguageCode(value === "ALL" ? "" : value)}
            style={{ width: 150 }}
            options={[{ label: t("common.allLanguages"), value: "ALL" }, ...CONTENT_LOCALE_OPTIONS]}
          />
        </Space>
        <Button icon={<ReloadOutlined />} onClick={fetchPages} loading={loading}>
          {t("common.refresh")}
        </Button>
      </div>
      <Table rowKey="id" dataSource={pages} columns={columns} loading={loading} pagination={false} />
    </Card>
  );
};
