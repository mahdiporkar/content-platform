import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { AdminUser, Application } from "../../types";

const systemPermissionOptions = [
  { value: "applications.manage", label: "Manage Applications" },
  { value: "users.manage", label: "Manage Users" }
];

const servicePermissionOptions = [
  { value: "posts.manage", label: "Manage Posts" },
  { value: "articles.manage", label: "Manage Articles" },
  { value: "galleries.manage", label: "Manage Galleries" },
  { value: "images.manage", label: "Manage Images" },
  { value: "videos.manage", label: "Manage Videos" },
  { value: "collections.manage", label: "Manage Collections" },
  { value: "analytics.view", label: "View Analytics" }
];

export const UsersListPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResponse, applicationsResponse] = await Promise.all([
        client.get<AdminUser[]>("/api/v1/admin/users"),
        client.get<Application[]>("/api/v1/admin/applications")
      ]);
      setUsers(usersResponse.data);
      setApplications(applicationsResponse.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/api/v1/admin/users/${id}`);
      messageApi.success("User deleted.");
      await fetchUsers();
    } catch {
      messageApi.error("Failed to delete user.");
    }
  };

  const openModal = (user?: AdminUser) => {
    setEditing(user ?? null);
    setModalOpen(true);
    form.setFieldsValue({
      email: user?.email ?? "",
      role: user?.role ?? "editor",
      status: user?.status ?? "active",
      applicationIds: user?.applicationIds ?? [],
      systemPermissions: user?.systemPermissions ?? [],
      servicePermissions: user?.servicePermissions ?? []
    });
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      email: values.email,
      password: values.password || undefined,
      role: values.role,
      status: values.status,
      applicationIds: values.applicationIds || [],
      systemPermissions: values.systemPermissions || [],
      servicePermissions: values.servicePermissions || []
    };
    try {
      if (editing) {
        await client.put(`/api/v1/admin/users/${editing.id}`, payload);
      } else {
        await client.post("/api/v1/admin/users", payload);
      }
      messageApi.success(editing ? "User updated." : "User created.");
      setModalOpen(false);
      form.resetFields();
      await fetchUsers();
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        messageApi.error("Email is already in use.");
      } else if (status === 403) {
        messageApi.error("You do not have permission for this action.");
      } else {
        messageApi.error("Failed to save user.");
      }
    }
  };

  const columns = useMemo<ColumnsType<AdminUser>>(
    () => [
      { title: "Email", dataIndex: "email", width: "35%" },
      { title: "Role", dataIndex: "role", width: "15%" },
      { title: "Status", dataIndex: "status", width: "15%" },
      {
        title: "Applications",
        dataIndex: "applicationIds",
        width: "20%",
        render: (value: string[]) =>
          value && value.length > 0 ? (
            <Typography.Text>{value.join(", ")}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          )
      },
      {
        title: "System Access",
        dataIndex: "systemPermissions",
        width: "20%",
        render: (value: string[]) =>
          value && value.length > 0 ? (
            <Typography.Text>{value.join(", ")}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          )
      },
      {
        title: "Service Access",
        dataIndex: "servicePermissions",
        width: "20%",
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
    []
  );

  return (
    <Card className="page-card">
      {contextHolder}
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
          <Form.Item label="Accessible Applications" name="applicationIds">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select one or more applications"
              options={applications.map((app) => ({ value: app.id, label: `${app.name} (${app.id})` }))}
            />
          </Form.Item>
          <Form.Item label="System Permissions" name="systemPermissions">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select system-level permissions"
              options={systemPermissionOptions}
            />
          </Form.Item>
          <Form.Item label="Service Permissions" name="servicePermissions">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select content-service permissions"
              options={servicePermissionOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
