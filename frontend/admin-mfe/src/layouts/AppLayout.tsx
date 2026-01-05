import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Input, Layout, Menu, Typography } from "antd";
import {
  AppstoreOutlined,
  FileTextOutlined,
  LogoutOutlined,
  ReadOutlined,
  VideoCameraOutlined
} from "@ant-design/icons";
import { useTenant } from "../app/tenant";
import { authStore } from "../app/auth";

const { Sider, Content, Header } = Layout;

export const AppLayout = () => {
  const { applicationId, setApplicationId } = useTenant();
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
            Content Platform
          </Typography.Title>
          <Typography.Text type="secondary">Admin Console</Typography.Text>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(`/${key}`)}
          items={[
            { key: "applications", icon: <AppstoreOutlined />, label: "Applications" },
            { key: "posts", icon: <FileTextOutlined />, label: "Posts" },
            { key: "articles", icon: <ReadOutlined />, label: "Articles" },
            { key: "videos", icon: <VideoCameraOutlined />, label: "Videos" }
          ]}
          className="sidebar-menu"
        />
        <div className="sidebar-footer">
          <Typography.Text strong className="sidebar-label">
            Application ID
          </Typography.Text>
          <Input
            placeholder="Enter app UUID"
            value={appIdInput}
            onChange={(event) => setAppIdInput(event.target.value)}
            size="small"
          />
          <Button size="small" block onClick={() => setApplicationId(appIdInput || "")}>
            Set Application
          </Button>
          <Button danger icon={<LogoutOutlined />} size="small" block onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Text className="header-tenant">
            Tenant:{" "}
            {applicationId ? (
              <span className="header-tenant__value">{applicationId}</span>
            ) : (
              <Typography.Text type="secondary">Not set</Typography.Text>
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
