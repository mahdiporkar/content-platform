import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTenant } from "../../app/tenant";
import {
  createSitemapCustomUrl,
  deleteSitemapCustomUrl,
  getSitemapSettings,
  listSitemapCustomUrls,
  listSitemapTemplates,
  previewSitemap,
  putSitemapOverride,
  putSitemapSettings,
  putSitemapTemplate,
  testSitemapUrl,
  updateSitemapCustomUrl
} from "../../api/sitemap";
import type { SitemapCustomUrl, SitemapPreviewEntry, SitemapSettings, SitemapTemplate } from "../../types";

const CHANGEFREQ_OPTIONS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

export const SitemapPage = () => {
  const { applicationId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [settings, setSettings] = useState<SitemapSettings | null>(null);
  const [templates, setTemplates] = useState<SitemapTemplate[]>([]);
  const [customUrls, setCustomUrls] = useState<SitemapCustomUrl[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<string | undefined>(undefined);
  const [previewItems, setPreviewItems] = useState<SitemapPreviewEntry[]>([]);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editingCustom, setEditingCustom] = useState<SitemapCustomUrl | null>(null);
  const [form] = Form.useForm();
  const [customForm] = Form.useForm();

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const [settingsResponse, templateResponse, customResponse] = await Promise.all([
        getSitemapSettings(applicationId),
        listSitemapTemplates(applicationId),
        listSitemapCustomUrls(applicationId)
      ]);
      setSettings(settingsResponse);
      setTemplates(templateResponse);
      setCustomUrls(customResponse);
      form.setFieldsValue({
        enabled: settingsResponse.enabled,
        baseUrl: settingsResponse.baseUrl || "",
        cacheTtlSeconds: settingsResponse.cacheTtlSeconds,
        regenStrategy: settingsResponse.regenStrategy
      });
    } finally {
      setLoading(false);
    }
  }, [applicationId, form]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSettings = async () => {
    if (!applicationId) return;
    const values = await form.validateFields();
    const saved = await putSitemapSettings(applicationId, values);
    setSettings(saved);
    messageApi.success("Settings saved");
  };

  const saveTemplate = async (row: SitemapTemplate, patch: Partial<SitemapTemplate>) => {
    if (!applicationId) return;
    const payload = {
      enabled: patch.enabled ?? row.enabled,
      template: patch.template ?? row.template ?? "",
      lastmodPolicy: patch.lastmodPolicy ?? row.lastmodPolicy,
      defaultChangefreq: patch.defaultChangefreq ?? row.defaultChangefreq ?? undefined,
      defaultPriority: patch.defaultPriority ?? row.defaultPriority ?? undefined
    };
    const saved = await putSitemapTemplate(applicationId, row.contentType, payload);
    setTemplates((prev) => prev.map((entry) => (entry.id === saved.id ? saved : entry)));
    messageApi.success(`Template "${row.contentType}" saved`);
  };

  const openPreview = async (contentType?: string) => {
    if (!applicationId) return;
    try {
      const response = await previewSitemap(applicationId, { contentType, limit: 100, offset: 0 });
      setPreviewType(contentType);
      setPreviewItems(response.items);
      setPreviewOpen(true);
    } catch (error) {
      const messageText =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const resolved =
        Array.isArray(messageText) ? messageText.join(", ") : messageText || "Failed to load sitemap preview";
      messageApi.error(resolved);
    }
  };

  const openCustomModal = (row?: SitemapCustomUrl) => {
    setEditingCustom(row || null);
    customForm.setFieldsValue(
      row
        ? {
            ...row,
            lastmodValue: row.lastmodValue || undefined
          }
        : {
            pathOrUrl: "",
            enabled: true,
            lastmodMode: "none"
          }
    );
    setCustomModalOpen(true);
  };

  const submitCustomUrl = async () => {
    if (!applicationId) return;
    const values = await customForm.validateFields();
    if (editingCustom) {
      await updateSitemapCustomUrl(applicationId, editingCustom.id, values);
      messageApi.success("Custom URL updated");
    } else {
      await createSitemapCustomUrl(applicationId, values);
      messageApi.success("Custom URL created");
    }
    setCustomModalOpen(false);
    await load();
  };

  const templateColumns = useMemo<ColumnsType<SitemapTemplate>>(
    () => [
      { title: "Type", dataIndex: "contentType", width: 120 },
      {
        title: "Enabled",
        dataIndex: "enabled",
        width: 110,
        render: (_, row) => (
          <Switch checked={row.enabled} onChange={(checked) => void saveTemplate(row, { enabled: checked })} />
        )
      },
      {
        title: "Template",
        dataIndex: "template",
        render: (_, row) => (
          <Input
            defaultValue={row.template || ""}
            placeholder="/path/{slug}"
            onBlur={(event) => void saveTemplate(row, { template: event.target.value })}
          />
        )
      },
      {
        title: "Lastmod",
        width: 140,
        render: (_, row) => (
          <Select
            defaultValue={row.lastmodPolicy}
            style={{ width: 130 }}
            options={[
              { value: "updatedAt", label: "updatedAt" },
              { value: "publishedAt", label: "publishedAt" }
            ]}
            onChange={(value) => void saveTemplate(row, { lastmodPolicy: value })}
          />
        )
      },
      {
        title: "Changefreq",
        width: 140,
        render: (_, row) => (
          <Select
            allowClear
            defaultValue={row.defaultChangefreq || undefined}
            style={{ width: 130 }}
            options={CHANGEFREQ_OPTIONS.map((value) => ({ value, label: value }))}
            onChange={(value) => void saveTemplate(row, { defaultChangefreq: value || null })}
          />
        )
      },
      {
        title: "Priority",
        width: 120,
        render: (_, row) => (
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            defaultValue={row.defaultPriority ?? undefined}
            onBlur={(event) => {
              const target = event.target as HTMLInputElement;
              const value = target.value === "" ? null : Number(target.value);
              void saveTemplate(row, { defaultPriority: value });
            }}
          />
        )
      },
      {
        title: "Status",
        width: 200,
        render: (_, row) => (
          <Space direction="vertical" size={0}>
            <Tag color={row.validateStatus === "OK" ? "green" : row.validateStatus === "WARNING" ? "orange" : "red"}>
              {row.validateStatus}
            </Tag>
            {(row.validateErrors || []).map((error) => (
              <Typography.Text key={error} type="secondary" style={{ fontSize: 11 }}>
                {error}
              </Typography.Text>
            ))}
          </Space>
        )
      },
      {
        title: "Actions",
        width: 120,
        render: (_, row) => (
          <Button onClick={() => void openPreview(row.contentType)} type="link">
            Preview
          </Button>
        )
      }
    ],
    []
  );

  const customColumns = useMemo<ColumnsType<SitemapCustomUrl>>(
    () => [
      { title: "URL", dataIndex: "pathOrUrl" },
      { title: "Enabled", dataIndex: "enabled", width: 90, render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "Yes" : "No"}</Tag> },
      { title: "Changefreq", dataIndex: "changefreq", width: 120 },
      { title: "Priority", dataIndex: "priority", width: 100 },
      {
        title: "Actions",
        width: 220,
        render: (_, row) => (
          <Space>
            <Button size="small" onClick={() => openCustomModal(row)}>
              Edit
            </Button>
            <Button
              size="small"
              onClick={async () => {
                const result = await testSitemapUrl(applicationId || "", row.pathOrUrl.startsWith("/") && settings?.baseUrl ? `${settings.baseUrl}${row.pathOrUrl}` : row.pathOrUrl);
                messageApi.info(result.ok ? `OK (${result.httpStatus})` : result.errorMessage || `Status ${result.httpStatus}`);
              }}
            >
              Test
            </Button>
            <Popconfirm title="Delete custom URL?" onConfirm={() => applicationId ? deleteSitemapCustomUrl(applicationId, row.id).then(load) : Promise.resolve()}>
              <Button size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [applicationId, load, messageApi, settings?.baseUrl]
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {contextHolder}
      <Card title="Sitemap Settings" loading={loading}>
        <Form layout="vertical" form={form}>
          <Space align="start" wrap>
            <Form.Item name="enabled" label="Enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="baseUrl" label="Base URL (https://domain)">
              <Input style={{ width: 280 }} />
            </Form.Item>
            <Form.Item name="cacheTtlSeconds" label="Cache TTL (sec)">
              <InputNumber min={60} max={86400} />
            </Form.Item>
            <Form.Item name="regenStrategy" label="Regenerate Strategy">
              <Select
                style={{ width: 180 }}
                options={[
                  { value: "on_publish", label: "on_publish" },
                  { value: "scheduled", label: "scheduled" },
                  { value: "manual", label: "manual" }
                ]}
              />
            </Form.Item>
          </Space>
          <Button type="primary" onClick={() => void saveSettings()}>
            Save Settings
          </Button>
        </Form>
      </Card>

      <Card
        title="Templates by Content Type"
        extra={
          <Button onClick={() => void openPreview()} type="default">
            Preview All
          </Button>
        }
      >
        <Table rowKey="id" columns={templateColumns} dataSource={templates} pagination={false} />
      </Card>

      <Card
        title="Manual URLs"
        extra={
          <Button type="primary" onClick={() => openCustomModal()}>
            Add Manual URL
          </Button>
        }
      >
        <Table rowKey="id" columns={customColumns} dataSource={customUrls} pagination={false} />
      </Card>

      <Modal open={previewOpen} onCancel={() => setPreviewOpen(false)} footer={null} width={1100} title={`Sitemap Preview${previewType ? `: ${previewType}` : ""}`}>
        <Table<SitemapPreviewEntry>
          rowKey={(row) => `${row.contentType}:${row.contentId}:${row.finalUrl}`}
          dataSource={previewItems}
          columns={[
            { title: "Type", dataIndex: "contentType", width: 110 },
            { title: "Title", dataIndex: "title", width: 180 },
            { title: "URL", dataIndex: "finalUrl" },
            { title: "Source", dataIndex: "source", width: 90 },
            { title: "Status", dataIndex: "status", width: 90 },
            {
              title: "Actions",
              width: 260,
              render: (_, row) => (
                <Space>
                  <Button
                    size="small"
                    onClick={async () => {
                      if (!row.finalUrl || !applicationId) return;
                      const result = await testSitemapUrl(applicationId, row.finalUrl);
                      messageApi.info(result.ok ? `OK (${result.httpStatus})` : result.errorMessage || `Status ${result.httpStatus}`);
                    }}
                  >
                    Test
                  </Button>
                  {row.contentId ? (
                    <Button
                      size="small"
                      onClick={async () => {
                        if (!applicationId || !row.contentId) return;
                        await putSitemapOverride(applicationId, row.contentType, row.contentId, { excluded: true });
                        messageApi.success("Excluded");
                        await openPreview(previewType);
                      }}
                    >
                      Exclude
                    </Button>
                  ) : null}
                </Space>
              )
            }
          ]}
          expandable={{
            expandedRowRender: (row) =>
              row.errors?.length ? (
                <Space direction="vertical">
                  {row.errors.map((error) => (
                    <Typography.Text key={error} type="secondary">
                      {error}
                    </Typography.Text>
                  ))}
                </Space>
              ) : null
          }}
          pagination={{ pageSize: 20 }}
        />
      </Modal>

      <Modal
        open={customModalOpen}
        onCancel={() => setCustomModalOpen(false)}
        onOk={() => void submitCustomUrl()}
        title={editingCustom ? "Edit Manual URL" : "Add Manual URL"}
      >
        <Form form={customForm} layout="vertical">
          <Form.Item name="pathOrUrl" label="Path or URL" rules={[{ required: true }]}>
            <Input placeholder="/pricing or https://example.com/pricing" />
          </Form.Item>
          <Form.Item name="enabled" label="Enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="lastmodMode" label="Lastmod mode">
            <Select
              options={[
                { value: "none", label: "none" },
                { value: "now", label: "now" },
                { value: "fixed_date", label: "fixed_date" }
              ]}
            />
          </Form.Item>
          <Form.Item name="lastmodValue" label="Lastmod value (ISO)">
            <Input placeholder="2026-02-27T12:00:00Z" />
          </Form.Item>
          <Form.Item name="changefreq" label="Changefreq">
            <Select allowClear options={CHANGEFREQ_OPTIONS.map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <InputNumber min={0} max={1} step={0.1} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
