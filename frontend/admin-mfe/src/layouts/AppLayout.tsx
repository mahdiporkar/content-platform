import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Input, Layout, Menu, Select, Typography } from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PictureOutlined,
  ReadOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined
} from "@ant-design/icons";
import { useTenant } from "../app/tenant";
import { authStore } from "../app/auth";
import { type SupportedLocale, useI18n } from "../i18n";

const { Sider, Content, Header } = Layout;

export const AppLayout = () => {
  const { applicationId, setApplicationId } = useTenant();
  const { locale, setLocale, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [appIdInput, setAppIdInput] = useState(applicationId);

  const handleLogout = () => {
    authStore.clearToken();
    window.location.href = "/login";
  };

  useEffect(() => {
    setAppIdInput(applicationId);
  }, [applicationId]);

  const selectedKey = location.pathname.split("/")[1] || "posts";

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
          items={[
            { key: "applications", icon: <AppstoreOutlined />, label: t("menu.applications") },
            { key: "users", icon: <TeamOutlined />, label: t("menu.users") },
            { key: "collections", icon: <UnorderedListOutlined />, label: t("menu.collections") },
            { key: "posts", icon: <FileTextOutlined />, label: t("menu.posts") },
            { key: "articles", icon: <ReadOutlined />, label: t("menu.articles") },
            { key: "videos", icon: <VideoCameraOutlined />, label: t("menu.videos") },
            { key: "images", icon: <PictureOutlined />, label: t("menu.images") },
            { key: "analytics", icon: <BarChartOutlined />, label: t("menu.analytics") }
          ]}
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
          <Input
            placeholder={t("app.applicationPlaceholder")}
            value={appIdInput}
            onChange={(event) => setAppIdInput(event.target.value)}
            size="small"
          />
          <Button size="small" block onClick={() => setApplicationId(appIdInput || "")}>
            {t("app.setApplication")}
          </Button>
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
              <span className="header-tenant__value">{applicationId}</span>
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
