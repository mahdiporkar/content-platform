import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { AdminUser } from "../../types";

export const UsersListPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const response = await client.get<AdminUser[]>("/api/v1/admin/users");
    setUsers(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    await client.delete(`/api/v1/admin/users/${id}`);
    await fetchUsers();
  };

  const openModal = (user?: AdminUser) => {
    setEditing(user ?? null);
    setModalOpen(true);
    form.setFieldsValue({
      email: user?.email ?? "",
      role: user?.role ?? "editor",
      status: user?.status ?? "active",
      applicationIds: (user?.applicationIds ?? []).join(", ")
    });
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      email: values.email,
      password: values.password || undefined,
      role: values.role,
      status: values.status,
      applicationIds: values.applicationIds
        ? values.applicationIds
            .split(",")
            .map((entry: string) => entry.trim())
            .filter(Boolean)
        : []
    };
    if (editing) {
      await client.put(`/api/v1/admin/users/${editing.id}`, payload);
    } else {
      await client.post("/api/v1/admin/users", payload);
    }
    setModalOpen(false);
    form.resetFields();
    await fetchUsers();
  };

  const columns = useMemo<ColumnsType<AdminUser>>(
    () => [
      { title: "Email", dataIndex: "email", width: "35%" },
      { title: "Role", dataIndex: "role", width: "15%" },
      { title: "Status", dataIndex: "status", width: "15%" },
      {
        title: "Applications",
        dataIndex: "applicationIds",
        width: "25%",
        render: (value: string[]) =>
          value && value.length > 0 ? (
            <Typography.Text>{value.join(", ")}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          )
      },
      {
        title: "Actions",
        key: "actions",
        width: "10%",
        render: (_, user) => (
          <Space size="small">
            <Button type="text" onClick={() => openModal(user)}>
              Edit
            </Button>
            <Popconfirm
              title="Delete this user?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(user.id)}
            >
              <Button danger type="text">
                Delete
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [editing]
  );

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            Users
          </Typography.Title>
          <Typography.Text type="secondary">Manage admin users and roles.</Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Button type="primary" onClick={() => openModal()}>
          New User
        </Button>
      </div>
      <Table rowKey="id" dataSource={users} columns={columns} loading={loading} pagination={false} />

      <Modal
        open={modalOpen}
        title={editing ? "Edit User" : "Create User"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editing ? "Save" : "Create"}
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={editing ? [] : [{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "super_admin", label: "Super Admin" },
                { value: "editor", label: "Editor" },
                { value: "publisher", label: "Publisher" }
              ]}
            />
          </Form.Item>
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" }
              ]}
            />
          </Form.Item>
          <Form.Item label="Application IDs" name="applicationIds">
            <Input placeholder="app-uuid-1, app-uuid-2" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
