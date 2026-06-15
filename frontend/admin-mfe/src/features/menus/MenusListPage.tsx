import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { CONTENT_LOCALE_OPTIONS } from "../../constants/locales";
import { MenuLocation, MenuStatus, SiteMenu } from "../../types";
import { useI18n } from "../../i18n";

const statusOptions: MenuStatus[] = ["ACTIVE", "INACTIVE"];
const locationOptions: MenuLocation[] = ["HEADER", "FOOTER", "SIDEBAR", "MOBILE"];

export const MenusListPage = () => {
  const { applicationId } = useTenant();
  const { locale, t, v } = useI18n();
  const navigate = useNavigate();
  const [languageCode, setLanguageCode] = useState("");
  const [status, setStatus] = useState<MenuStatus | "">("");
  const [menus, setMenus] = useState<SiteMenu[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    void fetchMenus();
  }, [applicationId, languageCode, status]);

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
        width: "10%",
        render: (_, menu) => (
          <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/menus/${menu.id}`, { state: { menu } })}>
            {t("common.edit")}
          </Button>
        )
      }
    ],
    [locale, navigate, t, v]
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
        <Button icon={<ReloadOutlined />} onClick={fetchMenus} loading={loading}>
          {t("common.refresh")}
        </Button>
      </div>
      <Table rowKey="id" dataSource={menus} columns={columns} loading={loading} pagination={false} />
    </Card>
  );
};
