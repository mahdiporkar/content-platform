import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Form, Input, Select, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { Collection, CollectionItem } from "../../types";
import { useTenant } from "../../app/tenant";

type Mode = "create" | "edit";

type LocationState = {
  collection?: Collection;
};

export const CollectionEditorPage = ({ mode }: { mode: Mode }) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const { applicationId } = useTenant();
  const [slug, setSlug] = useState(state?.collection?.slug ?? "");
  const [title, setTitle] = useState(state?.collection?.title ?? "");
  const [description, setDescription] = useState(state?.collection?.description ?? "");
  const [allowedTypes, setAllowedTypes] = useState<string[]>(state?.collection?.allowedTypes ?? []);
  const [maxItems, setMaxItems] = useState<string>(
    state?.collection?.maxItems ? String(state?.collection?.maxItems) : ""
  );
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [newItemId, setNewItemId] = useState("");
  const [newItemType, setNewItemType] = useState<"article" | "video" | "image">("article");
  const [loading, setLoading] = useState(false);

  const loadCollection = async (id: string) => {
    setLoading(true);
    const response = await client.get<Collection>(`/api/v1/admin/collections/${id}`);
    setSlug(response.data.slug);
    setTitle(response.data.title);
    setDescription(response.data.description ?? "");
    setAllowedTypes(response.data.allowedTypes ?? []);
    setMaxItems(response.data.maxItems ? String(response.data.maxItems) : "");
    const itemsResponse = await client.get<CollectionItem[]>(`/api/v1/admin/collections/${id}/items`);
    setItems(itemsResponse.data);
    setLoading(false);
  };

  useEffect(() => {
    if (mode === "edit" && params.id && !state?.collection) {
      loadCollection(params.id);
    }
  }, [mode, params.id, state?.collection]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applicationId || !title.trim() || !slug.trim()) {
      return;
    }
    setLoading(true);
    const payload = {
      applicationId,
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      allowedTypes,
      maxItems: maxItems ? Number(maxItems) : undefined
    };
    if (mode === "create") {
      await client.post("/api/v1/admin/collections", payload);
    } else if (params.id) {
      await client.put(`/api/v1/admin/collections/${params.id}`, payload);
    }
    setLoading(false);
    navigate("/collections");
  };

  const handleAddItem = async () => {
    if (!params.id || !newItemId.trim()) {
      return;
    }
    const response = await client.post<CollectionItem>(`/api/v1/admin/collections/${params.id}/items`, {
      contentId: newItemId.trim(),
      contentType: newItemType
    });
    setItems((prev) => [...prev, response.data].sort((a, b) => a.position - b.position));
    setNewItemId("");
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!params.id) {
      return;
    }
    await client.delete(`/api/v1/admin/collections/${params.id}/items/${itemId}`);
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleReorder = async (ordered: CollectionItem[]) => {
    if (!params.id) {
      return;
    }
    const orderedIds = ordered.map((item) => item.id);
    const response = await client.put<CollectionItem[]>(
      `/api/v1/admin/collections/${params.id}/items/reorder`,
      { orderedItemIds: orderedIds }
    );
    setItems(response.data);
  };

  const columns = useMemo<ColumnsType<CollectionItem>>(
    () => [
      { title: "Type", dataIndex: "contentType", width: "15%" },
      { title: "Content ID", dataIndex: "contentId", width: "55%" },
      { title: "Position", dataIndex: "position", width: "10%" },
      {
        title: "Actions",
        key: "actions",
        width: "20%",
        render: (_, item) => (
          <Space size="small">
            <Button
              type="text"
              onClick={() => {
                const index = items.findIndex((entry) => entry.id === item.id);
                if (index <= 0) {
                  return;
                }
                const reordered = [...items];
                const temp = reordered[index - 1];
                reordered[index - 1] = reordered[index];
                reordered[index] = temp;
                handleReorder(reordered);
              }}
            >
              Up
            </Button>
            <Button
              type="text"
              onClick={() => {
                const index = items.findIndex((entry) => entry.id === item.id);
                if (index >= items.length - 1) {
                  return;
                }
                const reordered = [...items];
                const temp = reordered[index + 1];
                reordered[index + 1] = reordered[index];
                reordered[index] = temp;
                handleReorder(reordered);
              }}
            >
              Down
            </Button>
            <Button danger type="text" onClick={() => handleRemoveItem(item.id)}>
              Remove
            </Button>
          </Space>
        )
      }
    ],
    [items]
  );

  const titleText = mode === "create" ? "New Collection" : "Edit Collection";
  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {titleText}
          </Typography.Title>
          <Typography.Text type="secondary">Configure curated lists for this application.</Typography.Text>
        </div>
      </div>
      <Form layout="vertical" onSubmitCapture={handleSubmit} style={{ maxWidth: 600 }}>
        <Form.Item label="Slug" required>
          <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
        </Form.Item>
        <Form.Item label="Title" required>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Form.Item>
        <Form.Item label="Description">
          <Input.TextArea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
        </Form.Item>
        <Form.Item label="Allowed Types">
          <Select
            mode="multiple"
            value={allowedTypes}
            onChange={(value) => setAllowedTypes(value)}
            options={[
              { value: "article", label: "Article" },
              { value: "video", label: "Video" },
              { value: "image", label: "Image" }
            ]}
          />
        </Form.Item>
        <Form.Item label="Max Items">
          <Input value={maxItems} onChange={(event) => setMaxItems(event.target.value)} />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!title.trim() || !slug.trim()}>
            Save
          </Button>
          <Button onClick={() => navigate("/collections")}>Cancel</Button>
        </Space>
      </Form>

      {mode === "edit" && (
        <Card size="small" title="Collection Items" style={{ marginTop: 24 }}>
          <Space style={{ marginBottom: 16 }}>
            <Input
              placeholder="Content ID"
              value={newItemId}
              onChange={(event) => setNewItemId(event.target.value)}
            />
            <Select
              value={newItemType}
              onChange={(value) => setNewItemType(value)}
              options={[
                { value: "article", label: "Article" },
                { value: "video", label: "Video" },
                { value: "image", label: "Image" }
              ]}
            />
            <Button type="primary" onClick={handleAddItem}>
              Add
            </Button>
          </Space>
          <Table rowKey="id" dataSource={items} columns={columns} pagination={false} />
        </Card>
      )}
    </Card>
  );
};
