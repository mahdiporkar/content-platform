import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Popconfirm, Space, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { Application } from "../../types";
import { useI18n } from "../../i18n";

export const ApplicationsListPage = () => {
  const navigate = useNavigate();
  const { t, v } = useI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const response = await client.get<Application[]>("/api/v1/admin/applications");
    setApplications(response.data);
    setLoading(false);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await client.delete(`/api/v1/admin/applications/${id}`);
      await fetchApplications();
    },
    [fetchApplications]
  );

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const columns = useMemo<ColumnsType<Application>>(
    () => [
      { title: t("common.name"), dataIndex: "name", width: "30%" },
      {
        title: t("common.status"),
        dataIndex: "status",
        width: "10%",
        render: (value: string | undefined) =>
          value ? <Typography.Text>{v(value)}</Typography.Text> : <Typography.Text type="secondary">-</Typography.Text>
      },
      {
        title: t("common.mediaPolicy"),
        dataIndex: "mediaPolicy",
        width: "15%",
        render: (value: string | undefined) =>
          value ? <Typography.Text>{value}</Typography.Text> : <Typography.Text type="secondary">-</Typography.Text>
      },
      {
        title: t("common.website"),
        dataIndex: "websiteUrl",
        width: "25%",
        render: (value: string | undefined) =>
          value ? (
            <a href={value} target="_blank" rel="noopener noreferrer">
              {value}
            </a>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          )
      },
      {
        title: "ID",
        dataIndex: "id",
        width: "10%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      {
        title: t("common.actions"),
        key: "actions",
        width: "10%",
        render: (_, application) => (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/applications/${application.id}`, { state: { application } })}
            >
              {t("common.edit")}
            </Button>
            <Popconfirm
              title={t("page.deleteApplication")}
              onConfirm={() => handleDelete(application.id)}
              okText={t("common.delete")}
              cancelText={t("common.cancel")}
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />}>
                {t("common.delete")}
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [handleDelete, navigate, t, v]
  );

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {t("page.applications")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("page.applicationsDescription")}
          </Typography.Text>
        </div>
      </div>

      <div className="page-actions">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/applications/new")}>
          {t("page.newApplication")}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchApplications} loading={loading}>
          {t("common.refresh")}
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={applications}
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{
          emptyText: (
            <div className="table-empty">
              <Typography.Text type="secondary">{t("common.noResults")}</Typography.Text>
              <div>
                <Button type="primary" onClick={() => navigate("/applications/new")}>
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
