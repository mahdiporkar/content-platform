import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Layout, Menu, Select, Typography } from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PictureOutlined,
  ReadOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  MenuOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined
} from "@ant-design/icons";
import { useTenant } from "../app/tenant";
import {
  authStore,
  canAccessMedia,
  canAccessRoute,
  canAccessServicePermission,
  canAccessSitemap,
  canAccessSystemPermission,
  isSuperAdmin as isSuperAdminPayload
} from "../app/auth";
import client from "../api/client";
import { Application } from "../types";
import { type SupportedLocale, useI18n } from "../i18n";

const { Sider, Content, Header } = Layout;

export const AppLayout = () => {
  const { applicationId, setApplicationId } = useTenant();
  const { locale, setLocale, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [applicationOptions, setApplicationOptions] = useState<Array<{ value: string; label: string }>>([]);

  const tokenPayload = useMemo(() => authStore.getTokenPayload(), []);
  const accessibleApplicationIds = useMemo(
    () => Array.from(new Set((tokenPayload?.applicationIds || []).map((entry) => entry.trim()).filter(Boolean))),
    [tokenPayload]
  );
  const isSuperAdmin = isSuperAdminPayload(tokenPayload);
  const canSeeMediaManagerMenu = canAccessMedia(tokenPayload);
  const canSeeSitemapMenu = canAccessSitemap(tokenPayload);

  const handleLogout = () => {
    authStore.clearToken();
    window.location.href = "/login";
  };

  useEffect(() => {
    const fallbackOptions = accessibleApplicationIds.map((id) => ({ value: id, label: id }));
    setApplicationOptions(fallbackOptions);

    const canLoadApplications = canAccessSystemPermission(tokenPayload, "applications.manage");
    if (!canLoadApplications) {
      return;
    }

    const loadApplications = async () => {
      try {
        const response = await client.get<Application[]>("/api/v1/admin/applications");
        const allowedIds = isSuperAdmin ? null : new Set(accessibleApplicationIds);
        const options = response.data
          .filter((app) => !allowedIds || allowedIds.has(app.id))
          .map((app) => ({ value: app.id, label: `${app.name} (${app.id})` }));
        setApplicationOptions(options.length > 0 ? options : fallbackOptions);
      } catch {
        setApplicationOptions(fallbackOptions);
      }
    };

    void loadApplications();
  }, [accessibleApplicationIds, isSuperAdmin, tokenPayload]);

  useEffect(() => {
    if (!applicationId && applicationOptions.length > 0) {
      setApplicationId(applicationOptions[0].value);
    }
  }, [applicationId, applicationOptions, setApplicationId]);

  const selectedKey = location.pathname.split("/")[1] || "posts";
  const selectedApplicationLabel = applicationOptions.find((option) => option.value === applicationId)?.label;
  const menuItems = [
    ...(canAccessRoute(tokenPayload, "applications") ? [{ key: "applications", icon: <AppstoreOutlined />, label: t("menu.applications") }] : []),
    ...(canAccessRoute(tokenPayload, "users") ? [{ key: "users", icon: <TeamOutlined />, label: t("menu.users") }] : []),
    ...(canAccessRoute(tokenPayload, "collections") ? [{ key: "collections", icon: <UnorderedListOutlined />, label: t("menu.collections") }] : []),
    ...(canAccessRoute(tokenPayload, "posts") ? [{ key: "posts", icon: <FileTextOutlined />, label: t("menu.posts") }] : []),
    ...(canAccessRoute(tokenPayload, "articles") ? [{ key: "articles", icon: <ReadOutlined />, label: t("menu.articles") }] : []),
    ...(canAccessRoute(tokenPayload, "pages") ? [{ key: "pages", icon: <FileTextOutlined />, label: t("menu.pages") }] : []),
    ...(canAccessRoute(tokenPayload, "menus") ? [{ key: "menus", icon: <MenuOutlined />, label: t("menu.menus") }] : []),
    ...(canAccessRoute(tokenPayload, "galleries") ? [{ key: "galleries", icon: <PictureOutlined />, label: t("menu.galleries") }] : []),
    ...(canAccessRoute(tokenPayload, "videos") ? [{ key: "videos", icon: <VideoCameraOutlined />, label: t("menu.videos") }] : []),
    ...(canAccessRoute(tokenPayload, "images") ? [{ key: "images", icon: <PictureOutlined />, label: t("menu.images") }] : []),
    ...(canSeeMediaManagerMenu ? [{ key: "media", icon: <FolderOpenOutlined />, label: t("menu.media") }] : []),
    ...(canSeeSitemapMenu ? [{ key: "sitemap", icon: <GlobalOutlined />, label: t("menu.sitemap") }] : []),
    ...(canAccessServicePermission(tokenPayload, "analytics.view") ? [{ key: "analytics", icon: <BarChartOutlined />, label: t("menu.analytics") }] : [])
  ];

  return (
    <Layout className="app-shell">
      <Sider width={260} className="sidebar">
        <div className="sidebar-title">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t("app.brand")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("app.console")}</Typography.Text>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(`/${key}`)}
          items={menuItems}
          className="sidebar-menu"
        />
        <div className="sidebar-footer">
          <Typography.Text strong className="sidebar-label">
            {t("app.language")}
          </Typography.Text>
          <Select
            size="small"
            value={locale}
            onChange={(value) => setLocale(value as SupportedLocale)}
            options={[
              { value: "fa", label: "فارسی" },
              { value: "en", label: "English" },
              { value: "ar", label: "العربية" },
              { value: "zh", label: "中文" },
              { value: "ru", label: "Русский" }
            ]}
          />
          <Typography.Text strong className="sidebar-label">
            {t("app.applicationId")}
          </Typography.Text>
          <Select
            className="sidebar-app-select"
            size="small"
            value={applicationId || undefined}
            options={applicationOptions}
            onChange={(value) => setApplicationId(value || "")}
            placeholder={
              applicationOptions.length > 0 ? t("app.applicationPlaceholder") : t("app.noAccessibleApplications")
            }
            disabled={applicationOptions.length === 0}
            showSearch
            optionFilterProp="label"
          />
          <Button danger icon={<LogoutOutlined />} size="small" block onClick={handleLogout}>
            {t("app.logout")}
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Text className="header-tenant">
            {t("app.tenant")}:{" "}
            {applicationId ? (
              <span className="header-tenant__value">{selectedApplicationLabel || applicationId}</span>
            ) : (
              <Typography.Text type="secondary">{t("app.notSet")}</Typography.Text>
            )}
          </Typography.Text>
        </Header>
        <Content className="content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
