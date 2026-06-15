import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { authStore } from "../../app/auth";
import { useTenant } from "../../app/tenant";
import { AdminUser, Application } from "../../types";
import { useI18n } from "../../i18n";

const systemPermissions = ["applications.manage", "users.manage"];
const servicePermissions = [
  "posts.manage",
  "articles.manage",
  "media.manage",
  "pages.manage",
  "menus.manage",
  "galleries.manage",
  "images.manage",
  "videos.manage",
  "collections.manage",
  "analytics.view"
];

export const UsersListPage = () => {
  const { t, v } = useI18n();
  const { applicationId } = useTenant();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const tokenPayload = useMemo(() => authStore.getTokenPayload(), []);
  const isSuperAdmin = tokenPayload?.role === "super_admin";
  const currentApplicationId = applicationId || tokenPayload?.applicationIds?.[0] || "";
  const availableSystemPermissions = useMemo(
    () => (isSuperAdmin ? systemPermissions : systemPermissions.filter((permission) => (tokenPayload?.systemPermissions || []).includes(permission))),
    [isSuperAdmin, tokenPayload?.systemPermissions]
  );
  const availableServicePermissions = useMemo(
    () => (isSuperAdmin ? servicePermissions : servicePermissions.filter((permission) => (tokenPayload?.servicePermissions || []).includes(permission))),
    [isSuperAdmin, tokenPayload?.servicePermissions]
  );
  const roleOptions = useMemo(
    () => [
      ...(isSuperAdmin ? [{ value: "super_admin", label: v("super_admin") }] : []),
      { value: "system_admin", label: v("system_admin") },
      { value: "editor", label: v("editor") },
      { value: "publisher", label: v("publisher") }
    ],
    [isSuperAdmin, v]
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (!isSuperAdmin && !currentApplicationId) {
        setUsers([]);
        setApplications([]);
        return;
      }
      const usersResponse = await client.get<AdminUser[]>("/api/v1/admin/users", {
        params: currentApplicationId ? { applicationId: currentApplicationId } : undefined
      });
      setUsers(usersResponse.data);

      try {
        const applicationsResponse = await client.get<Application[]>("/api/v1/admin/applications");
        setApplications(applicationsResponse.data);
      } catch {
        const tokenApplicationIds = authStore.getTokenPayload()?.applicationIds || [];
        setApplications(
          tokenApplicationIds.map((id) => ({
            id,
            name: id
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [currentApplicationId, isSuperAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/api/v1/admin/users/${id}`);
      messageApi.success(`${t("page.users")} - ${t("common.delete")}`);
      await fetchUsers();
    } catch {
      messageApi.error(t("common.noResults"));
    }
  };

  const openModal = (user?: AdminUser) => {
    setEditing(user ?? null);
    setModalOpen(true);
    form.setFieldsValue({
      email: user?.email ?? "",
      role: user?.role ?? "system_admin",
      status: user?.status ?? "active",
      applicationIds: isSuperAdmin ? user?.applicationIds ?? [] : currentApplicationId ? [currentApplicationId] : [],
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
      applicationIds: isSuperAdmin ? values.applicationIds || [] : editing ? undefined : currentApplicationId ? [currentApplicationId] : [],
      systemPermissions: values.systemPermissions || [],
      servicePermissions: values.servicePermissions || []
    };
    try {
      if (editing) {
        await client.put(`/api/v1/admin/users/${editing.id}`, payload);
      } else {
        await client.post("/api/v1/admin/users", payload);
      }
      messageApi.success(editing ? t("common.updated") : t("common.create"));
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
      { title: t("common.email"), dataIndex: "email", width: "35%" },
      { title: t("common.role"), dataIndex: "role", width: "15%", render: (value) => v(value) },
      { title: t("common.status"), dataIndex: "status", width: "15%", render: (value) => v(value) },
      {
        title: t("common.applications"),
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
        title: t("common.systemAccess"),
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
        title: t("common.serviceAccess"),
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
        title: t("common.actions"),
        key: "actions",
        width: "10%",
        render: (_, user) => (
          <Space size="small">
            <Button type="text" onClick={() => openModal(user)}>
              {t("common.edit")}
            </Button>
            <Popconfirm
              title={`${t("common.delete")} ${t("page.users")}؟`}
              okText={t("common.delete")}
              cancelText={t("common.cancel")}
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(user.id)}
            >
              <Button danger type="text">
                {t("common.delete")}
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [t, v]
  );

  return (
    <Card className="page-card">
      {contextHolder}
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {t("page.users")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.usersDescription")}</Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Button type="primary" onClick={() => openModal()}>
          {t("page.newUser")}
        </Button>
      </div>
      <Table rowKey="id" dataSource={users} columns={columns} loading={loading} pagination={false} />

      <Modal
        open={modalOpen}
        title={editing ? `${t("common.edit")} ${t("page.users")}` : t("page.newUser")}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editing ? t("common.save") : t("common.create")}
        cancelText={t("common.cancel")}
      >
        <Form layout="vertical" form={form}>
          <Form.Item label={t("common.email")} name="email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t("common.password")} name="password" rules={editing ? [] : [{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label={t("common.role")} name="role" rules={[{ required: true }]}>
            <Select
              options={roleOptions}
            />
          </Form.Item>
          <Form.Item label={t("common.status")} name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "active", label: v("active") },
                { value: "suspended", label: v("suspended") }
              ]}
            />
          </Form.Item>
          <Form.Item label={t("common.applications")} name="applicationIds">
            <Select
              mode="multiple"
              allowClear
              placeholder={t("common.applications")}
              disabled={!isSuperAdmin}
              options={(isSuperAdmin ? applications : applications.filter((app) => app.id === currentApplicationId)).map((app) => ({ value: app.id, label: `${app.name} (${app.id})` }))}
            />
          </Form.Item>
          <Form.Item label={t("common.systemAccess")} name="systemPermissions">
            <Select
              mode="multiple"
              allowClear
              placeholder={t("common.systemAccess")}
              options={availableSystemPermissions.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item label={t("common.serviceAccess")} name="servicePermissions">
            <Select
              mode="multiple"
              allowClear
              placeholder={t("common.serviceAccess")}
              options={availableServicePermissions.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
