import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, GalleryContent, PageResponse } from "../../types";
import { useI18n } from "../../i18n";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];
const statusColors: Record<ContentStatus, "default" | "success" | "warning" | "processing"> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
  SCHEDULED: "processing"
};

export const GalleriesListPage = () => {
  const { applicationId } = useTenant();
  const { locale, t, v } = useI18n();
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
      { title: t("common.title"), dataIndex: "title", width: "30%" },
      {
        title: t("common.slug"),
        dataIndex: "slug",
        width: "24%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      {
        title: t("common.images"),
        key: "gallery",
        width: "10%",
        render: (_, gallery) => gallery.gallery?.length ?? 0
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
        width: "14%",
        render: (value: string) => new Date(value).toLocaleString(locale)
      },
      {
        title: t("common.actions"),
        key: "actions",
        width: "10%",
        render: (_, gallery) => (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/galleries/${gallery.id}`, { state: { gallery } })}
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
            {t("page.galleries")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.galleriesDescription")}</Typography.Text>
        </div>
      </div>

      <div className="page-actions">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/galleries/new")}>
            {t("page.newGallery")}
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
        <Button icon={<ReloadOutlined />} onClick={fetchGalleries} loading={loading}>
          {t("common.refresh")}
        </Button>
      </div>

      <Table rowKey="id" dataSource={galleries} columns={columns} loading={loading} pagination={false} />
    </Card>
  );
};
