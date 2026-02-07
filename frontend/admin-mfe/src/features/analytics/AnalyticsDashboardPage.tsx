import React, { useCallback, useEffect, useState } from "react";
import { Card, Table, Typography } from "antd";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";

type TimelinePoint = { date: string; views: number };

export const AnalyticsDashboardPage = () => {
  const { applicationId } = useTenant();
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
            Analytics
          </Typography.Title>
          <Typography.Text type="secondary">View counts and engagement trends.</Typography.Text>
        </div>
      </div>

      <Card size="small" title="Top Content" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          dataSource={topItems}
          loading={loading}
          pagination={false}
          columns={[
            { title: "Title", dataIndex: "title" },
            { title: "Type", dataIndex: "type" },
            { title: "Views", dataIndex: "viewCount" }
          ]}
        />
      </Card>

      <Card size="small" title="Views Timeline (30 days)">
        <Table
          rowKey="date"
          dataSource={timeline}
          loading={loading}
          pagination={false}
          columns={[
            { title: "Date", dataIndex: "date" },
            { title: "Views", dataIndex: "views" }
          ]}
        />
      </Card>
    </Card>
  );
};
