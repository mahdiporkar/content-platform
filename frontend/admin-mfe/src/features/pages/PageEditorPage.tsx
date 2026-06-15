import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Switch, Typography } from "antd";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentEditor } from "../../components/ContentEditor";
import { CONTENT_LOCALE_OPTIONS, DEFAULT_CONTENT_LOCALE, type ContentLocale } from "../../constants/locales";
import { ContentStatus, DynamicPage } from "../../types";
import { useI18n } from "../../i18n";

type EditorMode = "create" | "edit";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const PageEditorPage = ({ mode }: { mode: EditorMode }) => {
  const { applicationId } = useTenant();
  const { t, v } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const initialPage = useMemo(() => (location.state as { page?: DynamicPage } | undefined)?.page, [location.state]);
  const [title, setTitle] = useState(initialPage?.title ?? "");
  const [slug, setSlug] = useState(initialPage?.slug ?? "");
  const [content, setContent] = useState(initialPage?.content ?? "");
  const [coverImage, setCoverImage] = useState(initialPage?.coverImage ?? "");
  const [languageCode, setLanguageCode] = useState<ContentLocale>((initialPage?.languageCode as ContentLocale) ?? DEFAULT_CONTENT_LOCALE);
  const [status, setStatus] = useState<ContentStatus>(initialPage?.status ?? "DRAFT");
  const [seoTitle, setSeoTitle] = useState(initialPage?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialPage?.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState<string[]>((initialPage?.seoKeywords ?? []) as string[]);
  const [parentId, setParentId] = useState(initialPage?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState<number | null>(initialPage?.sortOrder ?? null);
  const [showInMenu, setShowInMenu] = useState(initialPage?.showInMenu ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!applicationId) {
      setError("Application ID is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      applicationId,
      title,
      slug,
      content,
      coverImage,
      languageCode,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      parentId: parentId || null,
      sortOrder,
      showInMenu
    };
    try {
      if (mode === "create") {
        await client.post("/api/v1/admin/pages", payload);
      } else if (id) {
        await client.put(`/api/v1/admin/pages/${id}`, payload);
      }
      navigate("/pages");
    } catch {
      setError("Failed to save page. Check slug uniqueness and required fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {mode === "create" ? `${t("common.create")} ${t("page.pages")}` : `${t("common.edit")} ${t("page.pages")}`}
          </Typography.Title>
          <Typography.Text type="secondary">{t("page.pagesDescription")}</Typography.Text>
        </div>
      </div>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />}
      <Form layout="vertical">
        <Form.Item label={t("common.title")} required>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} size="large" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t("common.slug")} required>
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t("common.status")}>
              <Select value={status} onChange={setStatus} options={statusOptions.map((option) => ({ value: option, label: v(option) }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t("common.language")}>
              <Select value={languageCode} onChange={(value) => setLanguageCode(value as ContentLocale)} options={CONTENT_LOCALE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label={t("field.coverImage")}>
          <Input value={coverImage} onChange={(event) => setCoverImage(event.target.value)} />
        </Form.Item>
        <Form.Item label={t("editor.mediaTitle")}>
          <ContentEditor applicationId={applicationId} value={content} onChange={setContent} />
        </Form.Item>
        <Card size="small" title="Page Options" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Parent page ID">
                <Input value={parentId} onChange={(event) => setParentId(event.target.value)} allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t("field.sortOrder")}>
                <InputNumber value={sortOrder ?? undefined} onChange={(value) => setSortOrder(value ?? null)} min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t("field.showInMenu")}>
                <Switch checked={showInMenu} onChange={setShowInMenu} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Card size="small" title="SEO" style={{ marginBottom: 16 }}>
          <Form.Item label={t("field.metaTitle")}>
            <Input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
          </Form.Item>
          <Form.Item label={t("field.metaDescription")}>
            <Input.TextArea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} rows={3} />
          </Form.Item>
          <Form.Item label={t("field.metaKeywords")}>
            <Select mode="tags" value={seoKeywords} onChange={setSeoKeywords} tokenSeparators={[","]} />
          </Form.Item>
        </Card>
      </Form>
      <Space>
        <Button type="primary" onClick={handleSave} loading={saving} size="large">
          {t("common.save")}
        </Button>
        <Button onClick={() => navigate("/pages")} disabled={saving} size="large">
          {t("common.cancel")}
        </Button>
      </Space>
    </Card>
  );
};
