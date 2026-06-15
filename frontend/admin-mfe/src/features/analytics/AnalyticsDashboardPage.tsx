import React, { useCallback, useEffect, useState } from "react";
import { Card, Table, Typography } from "antd";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { useI18n } from "../../i18n";

type TimelinePoint = { date: string; views: number };

export const AnalyticsDashboardPage = () => {
  const { applicationId } = useTenant();
  const { t, v } = useI18n();
  const [topItems, setTopItems] = useState<{ id: string; title: string; type: string; viewCount: number }[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!applicationId) {
      return;
    }
    setLoading(true);
    const [topResponse, timelineResponse] = await Promise.all([
      client.get(`/api/v1/admin/analytics/top`, { params: { applicationId, limit: 10 } }),
      client.get(`/api/v1/admin/analytics/timeline`, { params: { applicationId, days: 30 } })
    ]);
    setTopItems(topResponse.data);
    setTimeline(timelineResponse.data);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {t("page.analytics")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.analyticsDescription")}</Typography.Text>
        </div>
      </div>

      <Card size="small" title={t("page.topContent")} style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          dataSource={topItems}
          loading={loading}
          pagination={false}
          columns={[
            { title: t("common.title"), dataIndex: "title" },
            { title: t("common.type"), dataIndex: "type", render: (value) => v(value) },
            { title: t("common.views"), dataIndex: "viewCount" }
          ]}
        />
      </Card>

      <Card size="small" title={t("page.viewsTimeline")}>
        <Table
          rowKey="date"
          dataSource={timeline}
          loading={loading}
          pagination={false}
          columns={[
            { title: t("common.date"), dataIndex: "date" },
            { title: t("common.views"), dataIndex: "views" }
          ]}
        />
      </Card>
    </Card>
  );
};
