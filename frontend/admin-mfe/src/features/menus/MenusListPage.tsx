import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, Upload } from "antd";
import { AppstoreAddOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { CONTENT_LOCALE_OPTIONS } from "../../constants/locales";
import { MenuLocation, MenuStatus, SiteMenu, TenantRoute } from "../../types";
import { useI18n } from "../../i18n";

const statusOptions: MenuStatus[] = ["ACTIVE", "INACTIVE"];
const locationOptions: MenuLocation[] = ["HEADER", "FOOTER", "SIDEBAR", "MOBILE"];
type RouteSyncResult = {
  synchronized: number;
  unavailable: number;
};

export const MenusListPage = () => {
  const { applicationId } = useTenant();
  const { locale, t, v } = useI18n();
  const navigate = useNavigate();
  const [languageCode, setLanguageCode] = useState("");
  const [status, setStatus] = useState<MenuStatus | "">("");
  const [menus, setMenus] = useState<SiteMenu[]>([]);
  const [routes, setRoutes] = useState<TenantRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingRoutes, setSyncingRoutes] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [creatingMenu, setCreatingMenu] = useState(false);
  const [routeMenu, setRouteMenu] = useState({
    code: "main-menu",
    title: "",
    location: "HEADER" as MenuLocation,
    languageCode: locale,
    status: "ACTIVE" as MenuStatus
  });
  const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchMenus = async () => {
    if (!applicationId) {
      setMenus([]);
      return;
    }
    setLoading(true);
    try {
      const response = await client.get<SiteMenu[]>("/api/v1/admin/menus", {
        params: { applicationId, languageCode: languageCode || undefined, status: status || undefined }
      });
      setMenus(response.data);
    } catch {
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    if (!applicationId) {
      setRoutes([]);
      return;
    }
    try {
      const response = await client.get<TenantRoute[]>("/api/v1/admin/menus/routes");
      setRoutes(response.data);
    } catch {
      setRoutes([]);
    }
  };

  useEffect(() => {
    void fetchMenus();
    void fetchRoutes();
  }, [applicationId, languageCode, status]);

  const syncRoutesFromFile = async (file: File) => {
    if (!applicationId) {
      setSyncFeedback({ type: "error", message: t("menu.syncApplicationRequired") });
      return;
    }

    setSyncingRoutes(true);
    setSyncFeedback(null);
    try {
      const manifest = JSON.parse(await file.text()) as unknown;
      if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
        throw new SyntaxError("Route manifest must be a JSON object.");
      }
      const response = await client.put<RouteSyncResult>("/api/v1/admin/menus/routes/sync", manifest);
      setSyncFeedback({
        type: "success",
        message: t("menu.syncSuccess")
          .replace("{synchronized}", String(response.data.synchronized))
          .replace("{unavailable}", String(response.data.unavailable))
      });
      await fetchRoutes();
    } catch (error) {
      setSyncFeedback({
        type: "error",
        message: error instanceof SyntaxError ? t("menu.syncInvalidJson") : t("menu.syncFailed")
      });
    } finally {
      setSyncingRoutes(false);
    }
  };

  const deleteMenu = async (menu: SiteMenu) => {
    setLoading(true);
    try {
      await client.delete(`/api/v1/admin/menus/${menu.id}`);
      await fetchMenus();
    } finally {
      setLoading(false);
    }
  };

  const createMenuFromRoutes = async () => {
    if (!applicationId || !routeMenu.code.trim() || !routeMenu.title.trim()) {
      setSyncFeedback({ type: "error", message: t("menu.createFromRoutesRequired") });
      return;
    }
    setCreatingMenu(true);
    setSyncFeedback(null);
    try {
      await client.post<SiteMenu>("/api/v1/admin/menus/from-routes", {
        ...routeMenu,
        code: routeMenu.code.trim(),
        title: routeMenu.title.trim()
      });
      setCreateMenuOpen(false);
      setSyncFeedback({ type: "success", message: t("menu.createFromRoutesSuccess") });
      await fetchMenus();
    } catch {
      setSyncFeedback({ type: "error", message: t("menu.createFromRoutesFailed") });
    } finally {
      setCreatingMenu(false);
    }
  };

  const columns = useMemo<ColumnsType<SiteMenu>>(
    () => [
      { title: t("common.title"), dataIndex: "title", width: "24%" },
      {
        title: t("common.code"),
        dataIndex: "code",
        width: "20%",
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>
      },
      { title: t("common.location"), dataIndex: "location", width: "12%", filters: locationOptions.map((value) => ({ text: v(value), value })), render: (value: MenuLocation) => v(value) },
      { title: t("common.language"), dataIndex: "languageCode", width: "10%" },
      {
        title: t("common.status"),
        dataIndex: "status",
        width: "12%",
        render: (value: MenuStatus) => <Tag color={value === "ACTIVE" ? "success" : "default"}>{v(value)}</Tag>
      },
      {
        title: t("common.updated"),
        dataIndex: "updatedAt",
        width: "13%",
        render: (value: string) => new Date(value).toLocaleString(locale)
      },
      {
        title: t("common.actions"),
        key: "actions",
        width: "16%",
        render: (_, menu) => (
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/menus/${menu.id}`, { state: { menu } })}>
              {t("common.edit")}
            </Button>
            <Popconfirm title={t("menu.deleteConfirm")} onConfirm={() => deleteMenu(menu)}>
              <Button type="text" danger icon={<DeleteOutlined />}>
                {t("common.delete")}
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [locale, navigate, t, v]
  );

  const routeColumns = useMemo<ColumnsType<TenantRoute>>(
    () => [
      { title: t("menu.routeKey"), dataIndex: "routeKey", width: "17%", render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
      { title: t("menu.source"), dataIndex: "source", width: "18%" },
      {
        title: t("common.title"),
        key: "title",
        width: "18%",
        render: (_, route) => route.titles[locale] ?? route.titles.en ?? route.routeKey
      },
      { title: t("common.url"), dataIndex: "pathTemplate", width: "22%", render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
      {
        title: t("common.status"),
        dataIndex: "status",
        width: "12%",
        render: (value: TenantRoute["status"]) => <Tag color={value === "AVAILABLE" ? "success" : "default"}>{value}</Tag>
      },
      {
        title: t("menu.lastSynced"),
        dataIndex: "lastSyncedAt",
        width: "13%",
        render: (value: string) => new Date(value).toLocaleString(locale)
      }
    ],
    [locale, t]
  );

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {t("page.menus")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.menusDescription")}</Typography.Text>
        </div>
      </div>
      <div className="page-actions">
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/menus/new")}>
            {t("page.newMenu")}
          </Button>
          <Button
            icon={<AppstoreAddOutlined />}
            disabled={!applicationId || !routes.some((route) => route.status === "AVAILABLE")}
            onClick={() => setCreateMenuOpen(true)}
          >
            {t("menu.createFromRoutes")}
          </Button>
          <Upload
            accept=".json,application/json"
            maxCount={1}
            showUploadList={false}
            disabled={!applicationId || syncingRoutes}
            beforeUpload={(file) => {
              void syncRoutesFromFile(file as File);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} loading={syncingRoutes} disabled={!applicationId}>
              {t("menu.syncManifest")}
            </Button>
          </Upload>
          <Select
            value={languageCode || "ALL"}
            onChange={(value) => setLanguageCode(value === "ALL" ? "" : value)}
            style={{ width: 150 }}
            options={[{ label: t("common.allLanguages"), value: "ALL" }, ...CONTENT_LOCALE_OPTIONS]}
          />
          <Select
            value={status || "ALL"}
            onChange={(value) => setStatus(value === "ALL" ? "" : (value as MenuStatus))}
            style={{ width: 150 }}
            options={[{ label: t("common.allStatuses"), value: "ALL" }, ...statusOptions.map((option) => ({ value: option, label: v(option) }))]}
          />
        </Space>
        <Button icon={<ReloadOutlined />} onClick={() => { void fetchMenus(); void fetchRoutes(); }} loading={loading}>
          {t("common.refresh")}
        </Button>
      </div>
      {syncFeedback && (
        <Alert
          type={syncFeedback.type}
          message={syncFeedback.message}
          showIcon
          closable
          onClose={() => setSyncFeedback(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      <Table rowKey="id" dataSource={menus} columns={columns} loading={loading} pagination={false} />
      <Typography.Title level={5} style={{ marginTop: 28 }}>
        {t("menu.registeredRoutes")}
      </Typography.Title>
      <Typography.Text type="secondary">{t("menu.registeredRoutesDescription")}</Typography.Text>
      <Table
        rowKey="id"
        dataSource={routes}
        columns={routeColumns}
        loading={loading || syncingRoutes}
        pagination={{ pageSize: 10 }}
        style={{ marginTop: 12 }}
      />
      <Modal
        title={t("menu.createFromRoutes")}
        open={createMenuOpen}
        confirmLoading={creatingMenu}
        okText={t("menu.create")}
        cancelText={t("common.cancel")}
        onOk={() => void createMenuFromRoutes()}
        onCancel={() => setCreateMenuOpen(false)}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Typography.Text>{t("common.code")}</Typography.Text>
            <Input
              value={routeMenu.code}
              onChange={(event) => setRouteMenu((current) => ({ ...current, code: event.target.value }))}
              placeholder="main-menu"
            />
          </div>
          <div>
            <Typography.Text>{t("common.title")}</Typography.Text>
            <Input
              value={routeMenu.title}
              onChange={(event) => setRouteMenu((current) => ({ ...current, title: event.target.value }))}
              placeholder={t("menu.titlePlaceholder")}
            />
          </div>
          <div>
            <Typography.Text>{t("common.language")}</Typography.Text>
            <Select
              value={routeMenu.languageCode}
              onChange={(value) => setRouteMenu((current) => ({ ...current, languageCode: value }))}
              options={CONTENT_LOCALE_OPTIONS}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <Typography.Text>{t("common.location")}</Typography.Text>
            <Select
              value={routeMenu.location}
              onChange={(value) => setRouteMenu((current) => ({ ...current, location: value }))}
              options={locationOptions.map((value) => ({ value, label: v(value) }))}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <Typography.Text>{t("common.status")}</Typography.Text>
            <Select
              value={routeMenu.status}
              onChange={(value) => setRouteMenu((current) => ({ ...current, status: value }))}
              options={statusOptions.map((value) => ({ value, label: v(value) }))}
              style={{ width: "100%" }}
            />
          </div>
          <Typography.Text type="secondary">{t("menu.createFromRoutesDescription")}</Typography.Text>
        </Space>
      </Modal>
    </Card>
  );
};
