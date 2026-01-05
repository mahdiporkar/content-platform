import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Popconfirm, Space, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { Application } from "../../types";

export const ApplicationsListPage = () => {
  const navigate = useNavigate();
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
      { title: "Name", dataIndex: "name", width: "30%" },
      {
        title: "Website",
        dataIndex: "websiteUrl",
        width: "35%",
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
        width: "25%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      {
        title: "Actions",
        key: "actions",
        width: "10%",
        render: (_, application) => (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/applications/${application.id}`, { state: { application } })}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete this application?"
              onConfirm={() => handleDelete(application.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [handleDelete, navigate]
  );

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Applications
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage your applications and their settings.
          </Typography.Text>
        </div>
      </div>

      <div className="page-actions">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/applications/new")}>
          New Application
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchApplications} loading={loading}>
          Refresh
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
              <Typography.Text type="secondary">No applications found</Typography.Text>
              <div>
                <Button type="primary" onClick={() => navigate("/applications/new")}>
                  Create your first application
                </Button>
              </div>
            </div>
          )
        }}
      />
    </Card>
  );
};
