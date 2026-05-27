import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import client from "../../api/client";
import { Collection, PageResponse } from "../../types";
import { useTenant } from "../../app/tenant";

export const CollectionsListPage = () => {
  const navigate = useNavigate();
  const { applicationId } = useTenant();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0 });
  const [messageApi, contextHolder] = message.useMessage();

  const fetchCollections = useCallback(
    async (next?: { page?: number; size?: number; search?: string }) => {
      if (!applicationId) {
        setCollections([]);
        return;
      }
      const page = next?.page ?? pagination.page;
      const size = next?.size ?? pagination.size;
      const searchValue = next?.search ?? search;
      setLoading(true);
      try {
        const response = await client.get<PageResponse<Collection>>(`/api/v1/admin/apps/${applicationId}/collections`, {
          params: { page, size, search: searchValue || undefined }
        });
        setCollections(response.data.items);
        setPagination({ page: response.data.page, size: response.data.size, total: response.data.totalElements });
      } finally {
        setLoading(false);
      }
    },
    [applicationId, pagination.page, pagination.size, search]
  );

  useEffect(() => {
    void fetchCollections({ page: 0 });
  }, [fetchCollections, applicationId]);

  const handleDelete = async (collection: Collection) => {
    if (!applicationId) {
      return;
    }
    try {
      await client.delete(`/api/v1/admin/apps/${applicationId}/collections/${collection.id}`);
      messageApi.success("Collection deleted.");
      await fetchCollections();
    } catch (error) {
      messageApi.error("Cannot delete this collection while it has items.");
    }
  };

  const columns = useMemo<ColumnsType<Collection>>(
    () => [
      {
        title: "Title",
        dataIndex: "title",
        width: "22%",
        render: (_, record) => (
          <Button type="link" onClick={() => navigate(`/collections/${record.id}`, { state: { collection: record } })}>
            {record.title}
          </Button>
        )
      },
      { title: "Slug", dataIndex: "slug", width: "16%" },
      {
        title: "Status",
        dataIndex: "status",
        width: "9%",
        render: (value: string | undefined) => {
          const color = value === "published" ? "green" : value === "archived" ? "red" : "default";
          return <Tag color={color}>{value || "draft"}</Tag>;
        }
      },
      { title: "Presentation", dataIndex: ["presentation", "type"], width: "10%", render: (value) => value || "list" },
      { title: "Priority", dataIndex: "priority", width: "8%", render: (value) => value ?? 0 },
      {
        title: "Allowed Types",
        dataIndex: "allowedTypes",
        width: "16%",
        render: (value: string[] | null | undefined) =>
          value && value.length > 0 ? (
            <Space wrap>
              {value.map((type) => (
                <Tag key={type}>{type}</Tag>
              ))}
            </Space>
          ) : (
            <Typography.Text type="secondary">All</Typography.Text>
          )
      },
      { title: "Items", dataIndex: "itemsCount", width: "7%" },
      {
        title: "Visibility",
        dataIndex: "isPublic",
        width: "9%",
        render: (value: boolean | undefined) => (value === false ? <Tag color="orange">Private</Tag> : <Tag color="green">Public</Tag>)
      },
      { title: "Updated", dataIndex: "updatedAt", width: "14%", render: (value: string) => new Date(value).toLocaleString() },
      {
        title: "Actions",
        key: "actions",
        width: "10%",
        render: (_, collection) => (
          <Space size="small">
            <Button type="text" onClick={() => navigate(`/collections/${collection.id}`, { state: { collection } })}>
              Edit
            </Button>
            <Popconfirm
              title="Delete this collection?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => void handleDelete(collection)}
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

  const onTableChange = (nextPagination: TablePaginationConfig) => {
    const page = Math.max(0, (nextPagination.current ?? 1) - 1);
    const size = nextPagination.pageSize ?? pagination.size;
    void fetchCollections({ page, size });
  };

  return (
    <Card className="page-card">
      {contextHolder}
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Collections
          </Typography.Title>
          <Typography.Text type="secondary">Curated content lists per application.</Typography.Text>
        </div>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Search title or slug"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={() => void fetchCollections({ page: 0 })}
          style={{ width: 280 }}
        />
        <Button type="primary" onClick={() => navigate("/collections/new")} disabled={!applicationId}>
          New Collection
        </Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={collections}
        columns={columns}
        loading={loading}
        onChange={onTableChange}
        pagination={{
          current: pagination.page + 1,
          pageSize: pagination.size,
          total: pagination.total,
          showSizeChanger: true
        }}
      />
    </Card>
  );
};
