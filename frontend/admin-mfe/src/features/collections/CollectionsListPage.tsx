import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Popconfirm, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { Collection } from "../../types";
import { useTenant } from "../../app/tenant";

export const CollectionsListPage = () => {
  const navigate = useNavigate();
  const { applicationId } = useTenant();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCollections = useCallback(async () => {
    if (!applicationId) {
      return;
    }
    setLoading(true);
    const response = await client.get<Collection[]>("/api/v1/admin/collections", {
      params: { applicationId }
    });
    setCollections(response.data);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleDelete = async (id: string) => {
    await client.delete(`/api/v1/admin/collections/${id}`);
    await fetchCollections();
  };

  const columns = useMemo<ColumnsType<Collection>>(
    () => [
      { title: "Title", dataIndex: "title", width: "30%" },
      { title: "Slug", dataIndex: "slug", width: "20%" },
      {
        title: "Allowed Types",
        dataIndex: "allowedTypes",
        width: "20%",
        render: (value: string[] | undefined) =>
          value && value.length > 0 ? value.join(", ") : <Typography.Text type="secondary">-</Typography.Text>
      },
      { title: "Max Items", dataIndex: "maxItems", width: "10%" },
      {
        title: "Actions",
        key: "actions",
        width: "20%",
        render: (_, collection) => (
          <Space size="small">
            <Button type="text" onClick={() => navigate(`/collections/${collection.id}`, { state: { collection } })}>
              Edit
            </Button>
            <Popconfirm
              title="Delete this collection?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(collection.id)}
            >
              <Button danger type="text">
                Delete
              </Button>
            </Popconfirm>
          </Space>
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
            Collections
          </Typography.Title>
          <Typography.Text type="secondary">Curated content lists per application.</Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Button type="primary" onClick={() => navigate("/collections/new")} disabled={!applicationId}>
          New Collection
        </Button>
      </div>
      <Table rowKey="id" dataSource={collections} columns={columns} loading={loading} pagination={false} />
    </Card>
  );
};
