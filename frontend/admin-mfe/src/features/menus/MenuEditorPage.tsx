import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Col, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Switch, Table, Tag, Typography } from "antd";
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined, SyncOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { CONTENT_LOCALE_OPTIONS, DEFAULT_CONTENT_LOCALE, type ContentLocale } from "../../constants/locales";
import { MenuContentCandidate, MenuItem, MenuItemTarget, MenuItemType, MenuLocation, MenuStatus, SiteMenu } from "../../types";
import { useI18n } from "../../i18n";

type EditorMode = "create" | "edit";
type ItemForm = {
  id?: string;
  parentId: string;
  title: string;
  itemType: MenuItemType;
  referenceId: string;
  url: string;
  target: MenuItemTarget;
  icon: string;
  cssClass: string;
  sortOrder: number;
  isVisible: boolean;
};

type LayoutDraft = Record<string, { parentId: string; sortOrder: number; isVisible: boolean }>;

const locationOptions: MenuLocation[] = ["HEADER", "FOOTER", "SIDEBAR", "MOBILE"];
const statusOptions: MenuStatus[] = ["ACTIVE", "INACTIVE"];
const itemTypes: MenuItemType[] = ["PAGE", "ARTICLE", "POST", "GALLERY", "CUSTOM_URL", "EXTERNAL_URL", "GROUP"];
const targets: MenuItemTarget[] = ["SELF", "BLANK"];

const flattenItems = (items: MenuItem[], depth = 0): Array<MenuItem & { depth: number }> =>
  items.flatMap((item) => [{ ...item, depth }, ...flattenItems(item.children || [], depth + 1)]);

const defaultItemForm: ItemForm = {
  parentId: "",
  title: "",
  itemType: "CUSTOM_URL",
  referenceId: "",
  url: "",
  target: "SELF",
  icon: "",
  cssClass: "",
  sortOrder: 0,
  isVisible: true
};

export const MenuEditorPage = ({ mode }: { mode: EditorMode }) => {
  const { applicationId } = useTenant();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const initialMenu = useMemo(() => (location.state as { menu?: SiteMenu } | undefined)?.menu, [location.state]);
  const [menu, setMenu] = useState<SiteMenu | undefined>(initialMenu);
  const [code, setCode] = useState(initialMenu?.code ?? "");
  const [title, setTitle] = useState(initialMenu?.title ?? "");
  const [menuLocation, setMenuLocation] = useState<MenuLocation>(initialMenu?.location ?? "HEADER");
  const [languageCode, setLanguageCode] = useState<ContentLocale>((initialMenu?.languageCode as ContentLocale) ?? DEFAULT_CONTENT_LOCALE);
  const [status, setStatus] = useState<MenuStatus>(initialMenu?.status ?? "INACTIVE");
  const [itemForm, setItemForm] = useState<ItemForm>(defaultItemForm);
  const [candidates, setCandidates] = useState<MenuContentCandidate[]>([]);
  const [layoutDraft, setLayoutDraft] = useState<LayoutDraft>({});
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatItems = useMemo(() => flattenItems(menu?.items ?? []), [menu?.items]);
  const editableParentOptions = useMemo(
    () => [
      { label: "Top level", value: "" },
      ...flatItems.map((item) => ({ label: `${"— ".repeat(item.depth)}${item.title}`, value: item.id }))
    ],
    [flatItems]
  );
  const parentOptions = useMemo(
    () => [
      { label: "Top level", value: "" },
      ...flatItems
        .filter((item) => item.id !== itemForm.id)
        .map((item) => ({ label: `${"— ".repeat(item.depth)}${item.title}`, value: item.id }))
    ],
    [flatItems, itemForm.id]
  );

  const resetLayoutDraft = (items: Array<MenuItem & { depth: number }>) => {
    setLayoutDraft(
      items.reduce<LayoutDraft>((draft, item) => {
        draft[item.id] = {
          parentId: item.parentId ?? "",
          sortOrder: item.sortOrder,
          isVisible: item.isVisible
        };
        return draft;
      }, {})
    );
  };

  const fetchMenu = async () => {
    if (!id) {
      return;
    }
    try {
      const response = await client.get<SiteMenu>(`/api/v1/admin/menus/${id}`);
      setMenu(response.data);
      setCode(response.data.code);
      setTitle(response.data.title);
      setMenuLocation(response.data.location);
      setLanguageCode(response.data.languageCode as ContentLocale);
      setStatus(response.data.status);
    } catch {
      setError("Failed to load menu.");
    }
  };

  const fetchCandidates = async () => {
    if (!id) {
      setCandidates([]);
      return;
    }
    setLoadingCandidates(true);
    try {
      const response = await client.get<MenuContentCandidate[]>(`/api/v1/admin/menus/${id}/published-content`);
      setCandidates(response.data);
    } catch {
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (mode === "edit") {
      void fetchMenu();
      void fetchCandidates();
    }
  }, [mode, id]);

  useEffect(() => {
    resetLayoutDraft(flatItems);
  }, [flatItems]);

  const saveMenu = async () => {
    if (!applicationId) {
      setError("Application ID is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = { applicationId, code, title, location: menuLocation, languageCode, status };
    try {
      if (mode === "create") {
        const response = await client.post<SiteMenu>("/api/v1/admin/menus", payload);
        navigate(`/menus/${response.data.id}`, { state: { menu: response.data }, replace: true });
      } else if (id) {
        const response = await client.put<SiteMenu>(`/api/v1/admin/menus/${id}`, payload);
        setMenu(response.data);
      }
    } catch {
      setError("Failed to save menu. Check code uniqueness per application and language.");
    } finally {
      setSaving(false);
    }
  };

  const saveItem = async () => {
    if (!id) {
      setError("Save the menu before adding items.");
      return;
    }
    const payload = {
      parentId: itemForm.parentId || null,
      title: itemForm.title,
      itemType: itemForm.itemType,
      referenceId: itemForm.referenceId || null,
      url: itemForm.url || null,
      target: itemForm.target,
      icon: itemForm.icon || null,
      cssClass: itemForm.cssClass || null,
      sortOrder: itemForm.sortOrder,
      isVisible: itemForm.isVisible
    };
    try {
      const response = itemForm.id
        ? await client.put<SiteMenu>(`/api/v1/admin/menus/${id}/items/${itemForm.id}`, payload)
        : await client.post<SiteMenu>(`/api/v1/admin/menus/${id}/items`, payload);
      setMenu(response.data);
      setItemForm(defaultItemForm);
      void fetchCandidates();
    } catch {
      setError("Failed to save menu item. Check item type requirements and parent hierarchy.");
    }
  };

  const addCandidate = async (candidate: MenuContentCandidate) => {
    if (!id) {
      return;
    }
    try {
      const response = await client.post<SiteMenu>(`/api/v1/admin/menus/${id}/items`, {
        parentId: null,
        title: candidate.title,
        itemType: candidate.type,
        referenceId: candidate.id,
        url: candidate.url,
        target: "SELF",
        icon: null,
        cssClass: null,
        sortOrder: flatItems.length,
        isVisible: true
      });
      setMenu(response.data);
      void fetchCandidates();
    } catch {
      setError("Failed to add published content to menu.");
    }
  };

  const syncPublishedContent = async () => {
    if (!id) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await client.post<SiteMenu>(`/api/v1/admin/menus/${id}/sync-published`);
      setMenu(response.data);
      void fetchCandidates();
    } catch {
      setError("Failed to sync published content.");
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (itemId: string, value: Partial<LayoutDraft[string]>) => {
    setLayoutDraft((prev) => ({
      ...prev,
      [itemId]: {
        parentId: prev[itemId]?.parentId ?? "",
        sortOrder: prev[itemId]?.sortOrder ?? 0,
        isVisible: prev[itemId]?.isVisible ?? true,
        ...value
      }
    }));
  };

  const saveLayout = async () => {
    if (!id) {
      return;
    }
    try {
      const response = await client.put<SiteMenu>(`/api/v1/admin/menus/${id}/items/layout`, {
        items: flatItems.map((item) => ({
          id: item.id,
          parentId: layoutDraft[item.id]?.parentId || null,
          sortOrder: layoutDraft[item.id]?.sortOrder ?? item.sortOrder,
          isVisible: layoutDraft[item.id]?.isVisible ?? item.isVisible
        }))
      });
      setMenu(response.data);
      void fetchCandidates();
    } catch {
      setError("Failed to save menu order. Check parent-child hierarchy.");
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!id) {
      return;
    }
    try {
      const response = await client.delete<SiteMenu>(`/api/v1/admin/menus/${id}/items/${itemId}`);
      setMenu(response.data);
      void fetchCandidates();
    } catch {
      setError("Failed to delete menu item.");
    }
  };

  const columns = useMemo<ColumnsType<MenuItem & { depth: number }>>(
    () => [
      {
        title: "Title",
        dataIndex: "title",
        render: (value: string, item) => <Typography.Text style={{ paddingInlineStart: item.depth * 20 }}>{value}</Typography.Text>
      },
      { title: "Type", dataIndex: "itemType", width: 130, render: (value: MenuItemType) => <Tag>{value}</Tag> },
      { title: t("common.references"), dataIndex: "referenceId", width: 210, render: (value?: string | null) => value ? <Typography.Text code>{value}</Typography.Text> : "-" },
      { title: "URL", dataIndex: "url", width: 220, render: (value?: string | null) => value || "-" },
      {
        title: "Parent",
        dataIndex: "parentId",
        width: 190,
        render: (_, item) => (
          <Select
            value={layoutDraft[item.id]?.parentId ?? item.parentId ?? ""}
            onChange={(value) => updateDraft(item.id, { parentId: value })}
            options={editableParentOptions.filter((option) => option.value !== item.id)}
            style={{ width: "100%" }}
          />
        )
      },
      {
        title: "Order",
        dataIndex: "sortOrder",
        width: 95,
        render: (_, item) => (
          <InputNumber
            value={layoutDraft[item.id]?.sortOrder ?? item.sortOrder}
            onChange={(value) => updateDraft(item.id, { sortOrder: value ?? 0 })}
            min={0}
            style={{ width: "100%" }}
          />
        )
      },
      {
        title: "Visible",
        dataIndex: "isVisible",
        width: 90,
        render: (_, item) => (
          <Switch
            checked={layoutDraft[item.id]?.isVisible ?? item.isVisible}
            onChange={(value) => updateDraft(item.id, { isVisible: value })}
          />
        )
      },
      {
        title: "Actions",
        key: "actions",
        width: 160,
        render: (_, item) => (
          <Space>
            <Button
              type="link"
              onClick={() =>
                setItemForm({
                  id: item.id,
                  parentId: item.parentId ?? "",
                  title: item.title,
                  itemType: item.itemType,
                  referenceId: item.referenceId ?? "",
                  url: item.url ?? "",
                  target: item.target,
                  icon: item.icon ?? "",
                  cssClass: item.cssClass ?? "",
                  sortOrder: item.sortOrder,
                  isVisible: item.isVisible
                })
              }
            >
              Edit
            </Button>
            <Popconfirm title="Delete this item and its children?" onConfirm={() => deleteItem(item.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ],
    [editableParentOptions, layoutDraft]
  );

  const candidateColumns = useMemo<ColumnsType<MenuContentCandidate>>(
    () => [
      { title: "Title", dataIndex: "title" },
      { title: "Type", dataIndex: "type", width: 110, render: (value: MenuContentCandidate["type"]) => <Tag>{value}</Tag> },
      { title: "Slug", dataIndex: "slug", width: 180, render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
      { title: "URL", dataIndex: "url", width: 240 },
      {
        title: "Menu",
        dataIndex: "alreadyInMenu",
        width: 120,
        render: (value: boolean) => (value ? <Tag color="success">{t("common.yes")}</Tag> : <Tag>{t("common.no")}</Tag>)
      },
      {
        title: "Actions",
        key: "actions",
        width: 120,
        render: (_, candidate) => (
          <Button type="link" disabled={candidate.alreadyInMenu} onClick={() => addCandidate(candidate)}>
            Add
          </Button>
        )
      }
    ],
    [flatItems.length]
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card className="page-card">
        <div className="page-header">
          <div>
            <Typography.Title level={4} style={{ marginBottom: 0 }}>
              {mode === "create" ? "Create Menu" : "Edit Menu"}
            </Typography.Title>
            <Typography.Text type="secondary">{t("page.menusDescription")}</Typography.Text>
          </div>
        </div>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />}
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={t("common.title")} required>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Code" required>
                <Input value={code} onChange={(event) => setCode(event.target.value)} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Location">
                <Select value={menuLocation} onChange={setMenuLocation} options={locationOptions.map((value) => ({ value, label: value }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t("common.language")}>
                <Select value={languageCode} onChange={(value) => setLanguageCode(value as ContentLocale)} options={CONTENT_LOCALE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t("common.status")}>
                <Select value={status} onChange={setStatus} options={statusOptions.map((value) => ({ value, label: value }))} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Space>
          <Button type="primary" onClick={saveMenu} loading={saving} size="large">
            Save Menu
          </Button>
          <Button onClick={() => navigate("/menus")} disabled={saving} size="large">
            Back
          </Button>
        </Space>
      </Card>

      {mode === "edit" && (
        <Card className="page-card">
          <div className="page-actions">
            <Typography.Title level={5} style={{ margin: 0 }}>
              Menu Items
            </Typography.Title>
            <Space>
              <Button icon={<SaveOutlined />} onClick={saveLayout}>
                Save order
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchMenu}>
                Refresh
              </Button>
            </Space>
          </div>
          <Card size="small" title={itemForm.id ? "Edit Item" : "Add Item"} style={{ marginBottom: 16 }}>
            <Form layout="vertical">
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label={t("common.title")} required>
                    <Input value={itemForm.title} onChange={(event) => setItemForm((prev) => ({ ...prev, title: event.target.value }))} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Type">
                    <Select value={itemForm.itemType} onChange={(value) => setItemForm((prev) => ({ ...prev, itemType: value }))} options={itemTypes.map((value) => ({ value, label: value }))} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Parent">
                    <Select value={itemForm.parentId} onChange={(value) => setItemForm((prev) => ({ ...prev, parentId: value }))} options={parentOptions} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="Reference ID">
                    <Input value={itemForm.referenceId} onChange={(event) => setItemForm((prev) => ({ ...prev, referenceId: event.target.value }))} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="URL">
                    <Input value={itemForm.url} onChange={(event) => setItemForm((prev) => ({ ...prev, url: event.target.value }))} />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="Target">
                    <Select value={itemForm.target} onChange={(value) => setItemForm((prev) => ({ ...prev, target: value }))} options={targets.map((value) => ({ value, label: value }))} />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="Order">
                    <InputNumber value={itemForm.sortOrder} onChange={(value) => setItemForm((prev) => ({ ...prev, sortOrder: value ?? 0 }))} min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="Icon">
                    <Input value={itemForm.icon} onChange={(event) => setItemForm((prev) => ({ ...prev, icon: event.target.value }))} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="CSS class">
                    <Input value={itemForm.cssClass} onChange={(event) => setItemForm((prev) => ({ ...prev, cssClass: event.target.value }))} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Visible">
                    <Switch checked={itemForm.isVisible} onChange={(value) => setItemForm((prev) => ({ ...prev, isVisible: value }))} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={saveItem}>
                {itemForm.id ? "Update Item" : "Add Item"}
              </Button>
              {itemForm.id && <Button onClick={() => setItemForm(defaultItemForm)}>{t("common.cancel")}</Button>}
            </Space>
          </Card>
          <Table rowKey="id" dataSource={flatItems} columns={columns} pagination={false} />
        </Card>
      )}

      {mode === "edit" && (
        <Card className="page-card">
          <div className="page-actions">
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Published Content
              </Typography.Title>
              <Typography.Text type="secondary">{t("page.menusDescription")}</Typography.Text>
            </div>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchCandidates} loading={loadingCandidates}>
                Refresh
              </Button>
              <Button type="primary" icon={<SyncOutlined />} onClick={syncPublishedContent} loading={saving}>
                Sync missing
              </Button>
            </Space>
          </div>
          <Table
            rowKey={(candidate) => `${candidate.type}:${candidate.id}`}
            dataSource={candidates}
            columns={candidateColumns}
            loading={loadingCandidates}
            pagination={{ pageSize: 8 }}
          />
        </Card>
      )}
    </Space>
  );
};
