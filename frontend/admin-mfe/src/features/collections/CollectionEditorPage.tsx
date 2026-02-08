import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import type { ColumnsType } from "antd/es/table";
import client from "../../api/client";
import { Collection, CollectionItem, ContentStatus, PageResponse } from "../../types";
import { useTenant } from "../../app/tenant";

type Mode = "create" | "edit";
type ContentType = "post" | "article" | "video" | "image";
type Candidate = {
  id: string;
  type: ContentType;
  title: string;
  slug?: string | null;
  locale?: string | null;
  status: ContentStatus;
  tags?: string[] | null;
};

type LocationState = { collection?: Collection };
const contentTypeOptions: { value: ContentType; label: string }[] = [
  { value: "post", label: "Post" },
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" }
];

export const CollectionEditorPage = ({ mode }: { mode: Mode }) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const { applicationId } = useTenant();
  const collectionId = params.id ?? "";
  const [slug, setSlug] = useState(state?.collection?.slug ?? "");
  const [title, setTitle] = useState(state?.collection?.title ?? "");
  const [description, setDescription] = useState(state?.collection?.description ?? "");
  const [allowedTypes, setAllowedTypes] = useState<ContentType[]>((state?.collection?.allowedTypes as ContentType[] | undefined) ?? []);
  const [maxItems, setMaxItems] = useState<string>(state?.collection?.maxItems ? String(state.collection.maxItems) : "");
  const [isPublic, setIsPublic] = useState(state?.collection?.isPublic ?? true);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [candidateType, setCandidateType] = useState<ContentType | undefined>(undefined);
  const [candidateStatus, setCandidateStatus] = useState<ContentStatus>("PUBLISHED");
  const [candidateLocale, setCandidateLocale] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateTagSearch, setCandidateTagSearch] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const selectedCollectionTypes = useMemo(
    () => (allowedTypes.length > 0 ? allowedTypes : contentTypeOptions.map((entry) => entry.value)),
    [allowedTypes]
  );

  const loadCollection = useCallback(
    async (id: string) => {
      if (!applicationId) {
        return;
      }
      setLoading(true);
      try {
        const [collectionResponse, itemResponse] = await Promise.all([
          client.get<Collection>(`/api/v1/admin/apps/${applicationId}/collections/${id}`),
          client.get<CollectionItem[]>(`/api/v1/admin/apps/${applicationId}/collections/${id}/items`)
        ]);
        const collection = collectionResponse.data;
        setSlug(collection.slug);
        setTitle(collection.title);
        setDescription(collection.description ?? "");
        setAllowedTypes((collection.allowedTypes as ContentType[] | undefined) ?? []);
        setMaxItems(collection.maxItems ? String(collection.maxItems) : "");
        setIsPublic(collection.isPublic ?? true);
        setItems(itemResponse.data.sort((a, b) => a.position - b.position));
      } finally {
        setLoading(false);
      }
    },
    [applicationId]
  );

  useEffect(() => {
    if (mode === "edit" && collectionId) {
      void loadCollection(collectionId);
    }
  }, [mode, collectionId, loadCollection]);

  const saveCollection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applicationId || !title.trim()) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        allowedTypes: allowedTypes.length > 0 ? allowedTypes : undefined,
        maxItems: maxItems ? Number(maxItems) : undefined,
        isPublic
      };
      if (mode === "create") {
        const response = await client.post<Collection>(`/api/v1/admin/apps/${applicationId}/collections`, payload);
        messageApi.success("Collection created.");
        navigate(`/collections/${response.data.id}`, { replace: true, state: { collection: response.data } });
      } else {
        await client.patch(`/api/v1/admin/apps/${applicationId}/collections/${collectionId}`, payload);
        messageApi.success("Collection updated.");
        await loadCollection(collectionId);
      }
    } catch (error) {
      messageApi.error("Saving collection failed.");
    } finally {
      setSaving(false);
    }
  };

  const fetchCandidates = useCallback(async () => {
    if (!applicationId) {
      return;
    }
    const types = candidateType ? [candidateType] : selectedCollectionTypes;
    const rows: Candidate[] = [];
    for (const type of types) {
      const path = type === "post" ? "posts" : type === "article" ? "articles" : type === "video" ? "videos" : "images";
      const response = await client.get<PageResponse<Record<string, unknown>>>(`/api/v1/admin/${path}`, {
        params: { applicationId, status: candidateStatus, size: 100, page: 0 }
      });
      response.data.items.forEach((entry) => {
        const titleValue = String(entry.title ?? "");
        const slugValue = entry.slug ? String(entry.slug) : null;
        const localeValue = entry.locale ? String(entry.locale) : null;
        const tagValues = Array.isArray(entry.tags) ? (entry.tags as string[]) : [];
        if (candidateSearch && !titleValue.toLowerCase().includes(candidateSearch.toLowerCase()) && !(slugValue ?? "").toLowerCase().includes(candidateSearch.toLowerCase())) {
          return;
        }
        if (candidateLocale && localeValue !== candidateLocale) {
          return;
        }
        if (candidateTagSearch) {
          const lower = candidateTagSearch.toLowerCase();
          if (!tagValues.some((tag) => tag.toLowerCase().includes(lower))) {
            return;
          }
        }
        rows.push({
          id: String(entry.id),
          type,
          title: titleValue,
          slug: slugValue,
          locale: localeValue,
          status: String(entry.status) as ContentStatus,
          tags: tagValues
        });
      });
    }
    setCandidates(rows);
  }, [applicationId, candidateType, selectedCollectionTypes, candidateStatus, candidateSearch, candidateLocale, candidateTagSearch]);

  const openAddModal = () => {
    setCandidateType(undefined);
    setCandidateStatus("PUBLISHED");
    setCandidateSearch("");
    setCandidateLocale("");
    setCandidateTagSearch("");
    setSelectedKeys([]);
    setAddModalOpen(true);
    void fetchCandidates();
  };

  const addSelected = async () => {
    if (!applicationId || !collectionId || selectedKeys.length === 0) {
      return;
    }
    const selected = candidates.filter((candidate) => selectedKeys.includes(`${candidate.type}:${candidate.id}`));
    const capacity = maxItems ? Number(maxItems) : null;
    if (capacity && items.length + selected.length > capacity) {
      messageApi.error("Max items limit reached.");
      return;
    }
    for (const entry of selected) {
      try {
        await client.post(`/api/v1/admin/apps/${applicationId}/collections/${collectionId}/items`, {
          contentType: entry.type,
          contentId: entry.id
        });
      } catch {
        messageApi.error(`Cannot add ${entry.title}.`);
      }
    }
    await loadCollection(collectionId);
    setAddModalOpen(false);
    messageApi.success("Selected content added.");
  };

  const removeItem = async (item: CollectionItem) => {
    if (!applicationId || !collectionId) {
      return;
    }
    try {
      await client.delete(`/api/v1/admin/apps/${applicationId}/collections/${collectionId}/items`, {
        data: { contentType: item.contentType, contentId: item.contentId }
      });
      await loadCollection(collectionId);
      messageApi.success("Item removed.");
    } catch {
      messageApi.error("Failed to remove item.");
    }
  };

  const reorderItems = async (ordered: CollectionItem[]) => {
    if (!applicationId || !collectionId) {
      return;
    }
    const payload = {
      items: ordered.map((item, index) => ({
        contentType: item.contentType,
        contentId: item.contentId,
        position: index + 1
      }))
    };
    try {
      const response = await client.patch<CollectionItem[]>(
        `/api/v1/admin/apps/${applicationId}/collections/${collectionId}/items/reorder`,
        payload
      );
      setItems(response.data.sort((a, b) => a.position - b.position));
    } catch {
      messageApi.error("Reorder failed.");
    }
  };

  const onDragStart = (event: React.DragEvent<HTMLTableRowElement>, index: number) => {
    event.dataTransfer.setData("text/plain", String(index));
  };

  const onDrop = (event: React.DragEvent<HTMLTableRowElement>, dropIndex: number) => {
    event.preventDefault();
    const dragIndex = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isNaN(dragIndex) || dragIndex === dropIndex) {
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setItems(reordered);
    void reorderItems(reordered);
  };

  const columns = useMemo<ColumnsType<CollectionItem>>(
    () => [
      {
        title: "Preview",
        dataIndex: "thumbnailUrl",
        width: "10%",
        render: (value: string | null | undefined) =>
          value ? <img src={value} alt="" style={{ width: 52, height: 38, objectFit: "cover", borderRadius: 4 }} /> : <Typography.Text type="secondary">-</Typography.Text>
      },
      { title: "Title", dataIndex: "title", width: "24%" },
      { title: "Type", dataIndex: "contentType", width: "8%" },
      { title: "Status", dataIndex: "status", width: "10%" },
      { title: "Locale", dataIndex: "locale", width: "8%", render: (value) => value || "-" },
      {
        title: "Tags",
        dataIndex: "tags",
        width: "14%",
        render: (value: string[] | null | undefined) =>
          value && value.length > 0 ? value.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>) : "-"
      },
      { title: "Published", dataIndex: "publishedAt", width: "12%", render: (value: string | null | undefined) => (value ? new Date(value).toLocaleString() : "-") },
      { title: "Position", dataIndex: "position", width: "6%" },
      {
        title: "Actions",
        key: "actions",
        width: "8%",
        render: (_, item) => (
          <Space size="small">
            <Button
              type="link"
              onClick={() => {
                const route = item.contentType === "post" ? "posts" : item.contentType === "article" ? "articles" : item.contentType === "video" ? "videos" : "images";
                navigate(`/${route}/${item.contentId}`);
              }}
            >
              Open
            </Button>
            <Button danger type="link" onClick={() => void removeItem(item)}>
              Remove
            </Button>
          </Space>
        )
      }
    ],
    [navigate, items]
  );

  const dataSourceForCandidates = candidates.map((entry) => ({
    key: `${entry.type}:${entry.id}`,
    ...entry,
    disabled: items.some((item) => item.contentType === entry.type && item.contentId === entry.id)
  }));

  return (
    <Card className="page-card">
      {contextHolder}
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {mode === "create" ? "New Collection" : "Collection Detail"}
          </Typography.Title>
          <Typography.Text type="secondary">Configure curated list and item order.</Typography.Text>
        </div>
      </div>

      <Card size="small" title="Settings" style={{ marginBottom: 16 }}>
        <Form layout="vertical" onSubmitCapture={saveCollection}>
          <Form.Item label="Title" required>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Form.Item>
          <Form.Item label="Slug">
            <Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Auto from title if empty" />
          </Form.Item>
          <Form.Item label="Description">
            <Input.TextArea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </Form.Item>
          <Form.Item label="Allowed Types">
            <Select<ContentType[]>
              mode="multiple"
              value={allowedTypes}
              onChange={(value) => setAllowedTypes(value)}
              options={contentTypeOptions}
            />
          </Form.Item>
          <Form.Item label="Max Items">
            <Input value={maxItems} onChange={(event) => setMaxItems(event.target.value)} />
          </Form.Item>
          <Form.Item label="Public">
            <Switch checked={isPublic} onChange={setIsPublic} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving || loading} disabled={!title.trim()}>
              Save
            </Button>
            <Button onClick={() => navigate("/collections")}>Back</Button>
          </Space>
        </Form>
      </Card>

      {mode === "edit" && (
        <Card
          size="small"
          title="Collection Items"
          extra={
            <Button type="primary" onClick={openAddModal}>
              + Add Content
            </Button>
          }
        >
          {items.length === 0 ? (
            <Empty description="No items in this collection yet." />
          ) : (
            <Table
              rowKey={(item) => item.id}
              dataSource={items}
              columns={columns}
              pagination={false}
              components={{
                body: {
                  row: (rowProps: React.HTMLAttributes<HTMLTableRowElement> & { "data-row-key"?: string }) => {
                    const rowKey = rowProps["data-row-key"];
                    const index = items.findIndex((item) => item.id === rowKey);
                    return (
                      <tr
                        {...rowProps}
                        draggable={index >= 0}
                        onDragStart={(event) => onDragStart(event, index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => onDrop(event, index)}
                        style={{ cursor: "move" }}
                      />
                    );
                  }
                }
              }}
            />
          )}
        </Card>
      )}

      <Modal
        title="Add Content"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={() => void addSelected()}
        okText="Add Selected"
        width={900}
      >
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            allowClear
            placeholder="Type"
            style={{ width: 140 }}
            value={candidateType}
            onChange={(value) => setCandidateType(value)}
            options={contentTypeOptions.filter((entry) => selectedCollectionTypes.includes(entry.value))}
          />
          <Select
            placeholder="Status"
            style={{ width: 140 }}
            value={candidateStatus}
            onChange={(value) => setCandidateStatus(value)}
            options={[
              { label: "Published", value: "PUBLISHED" },
              { label: "Draft", value: "DRAFT" },
              { label: "Scheduled", value: "SCHEDULED" },
              { label: "Archived", value: "ARCHIVED" }
            ]}
          />
          <Input
            placeholder="Locale"
            style={{ width: 120 }}
            value={candidateLocale}
            onChange={(event) => setCandidateLocale(event.target.value)}
          />
          <Input.Search
            placeholder="Search title/slug"
            style={{ width: 180 }}
            value={candidateSearch}
            onChange={(event) => setCandidateSearch(event.target.value)}
            onSearch={() => void fetchCandidates()}
          />
          <Input
            placeholder="Tag contains..."
            style={{ width: 160 }}
            value={candidateTagSearch}
            onChange={(event) => setCandidateTagSearch(event.target.value)}
          />
          <Button onClick={() => void fetchCandidates()}>Apply</Button>
        </Space>
        <Table
          size="small"
          rowKey={(item) => item.key}
          dataSource={dataSourceForCandidates}
          pagination={{ pageSize: 8 }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys as string[]),
            getCheckboxProps: (row) => ({ disabled: row.disabled as boolean })
          }}
          columns={[
            { title: "Type", dataIndex: "type", width: "10%" },
            { title: "Title", dataIndex: "title", width: "35%" },
            { title: "Slug", dataIndex: "slug", width: "15%", render: (value) => value || "-" },
            { title: "Locale", dataIndex: "locale", width: "10%", render: (value) => value || "-" },
            {
              title: "Tags",
              dataIndex: "tags",
              width: "20%",
              render: (value: string[] | undefined) => (value && value.length > 0 ? value.slice(0, 2).join(", ") : "-")
            },
            { title: "Status", dataIndex: "status", width: "10%" }
          ]}
        />
      </Modal>
    </Card>
  );
};
