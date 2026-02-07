import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Form, Input, Select, Space, Typography } from "antd";
import client from "../../api/client";
import { Application, GalleryImage, SeoMeta } from "../../types";

type Mode = "create" | "edit";

type LocationState = {
  application?: Application;
};

export const ApplicationEditorPage = ({ mode }: { mode: Mode }) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const [applicationId, setApplicationId] = useState(state?.application?.id ?? "");
  const [name, setName] = useState(state?.application?.name ?? "");
  const [description, setDescription] = useState(state?.application?.description ?? "");
  const [status, setStatus] = useState<"active" | "suspended">(
    state?.application?.status ?? "active"
  );
  const [mediaPolicy, setMediaPolicy] = useState<
    "public-via-gateway" | "domain-locked" | "jwt-required"
  >(state?.application?.mediaPolicy ?? "public-via-gateway");
  const [allowedDomains, setAllowedDomains] = useState<string[]>(
    state?.application?.allowedDomains ?? []
  );
  const [rateLimitPolicy, setRateLimitPolicy] = useState<string>(
    state?.application?.rateLimitPolicy ? JSON.stringify(state?.application?.rateLimitPolicy, null, 2) : ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(state?.application?.websiteUrl ?? "");
  const [publicBaseUrlOverride, setPublicBaseUrlOverride] = useState(
    state?.application?.publicBaseUrlOverride ?? ""
  );
  const [mediaBaseUrlOverride, setMediaBaseUrlOverride] = useState(
    state?.application?.mediaBaseUrlOverride ?? ""
  );
  const [apiToken, setApiToken] = useState(state?.application?.apiToken ?? "");
  const [tags, setTags] = useState<string[]>(state?.application?.tags ?? []);
  const [seo, setSeo] = useState<SeoMeta>(state?.application?.seo ?? {});
  const [gallery, setGallery] = useState<GalleryImage[]>(state?.application?.gallery ?? []);
  const [loading, setLoading] = useState(false);

  const tagsInput = useMemo(() => tags.join(", "), [tags]);

  const updateSeo = (key: keyof SeoMeta, value: string | boolean) => {
    setSeo((prev) => ({ ...prev, [key]: value }));
  };

  const updateGallery = (index: number, patch: Partial<GalleryImage>) => {
    setGallery((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addGalleryItem = () => {
    setGallery((prev) => [...prev, { url: "", alt: "", caption: "" }]);
  };

  const removeGalleryItem = (index: number) => {
    setGallery((prev) => prev.filter((_, idx) => idx !== index));
  };

  const loadApplication = async (id: string) => {
    setLoading(true);
    const response = await client.get<Application>(`/api/v1/admin/applications/${id}`);
    setApplicationId(response.data.id);
    setName(response.data.name);
    setDescription(response.data.description ?? "");
    setStatus(response.data.status ?? "active");
    setMediaPolicy(response.data.mediaPolicy ?? "public-via-gateway");
    setAllowedDomains(response.data.allowedDomains ?? []);
    setRateLimitPolicy(response.data.rateLimitPolicy ? JSON.stringify(response.data.rateLimitPolicy, null, 2) : "");
    setWebsiteUrl(response.data.websiteUrl ?? "");
    setPublicBaseUrlOverride(response.data.publicBaseUrlOverride ?? "");
    setMediaBaseUrlOverride(response.data.mediaBaseUrlOverride ?? "");
    setApiToken(response.data.apiToken ?? "");
    setTags(response.data.tags ?? []);
    setSeo(response.data.seo ?? {});
    setGallery(response.data.gallery ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (mode === "edit" && params.id && !state?.application) {
      loadApplication(params.id);
    }
  }, [mode, params.id, state?.application]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    let parsedRateLimit: Record<string, unknown> | undefined = undefined;
    if (rateLimitPolicy.trim()) {
      try {
        parsedRateLimit = JSON.parse(rateLimitPolicy);
      } catch {
        return;
      }
    }
    setLoading(true);
    if (mode === "create") {
      await client.post<Application>("/api/v1/admin/applications", {
        id: applicationId.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        mediaPolicy,
        allowedDomains,
        rateLimitPolicy: parsedRateLimit,
        websiteUrl: websiteUrl.trim() || undefined,
        publicBaseUrlOverride: publicBaseUrlOverride.trim() || undefined,
        mediaBaseUrlOverride: mediaBaseUrlOverride.trim() || undefined,
        apiToken: apiToken.trim() || undefined,
        tags,
        seo,
        gallery
      });
    } else if (params.id) {
      await client.put<Application>(`/api/v1/admin/applications/${params.id}`, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        mediaPolicy,
        allowedDomains,
        rateLimitPolicy: parsedRateLimit,
        websiteUrl: websiteUrl.trim() || undefined,
        publicBaseUrlOverride: publicBaseUrlOverride.trim() || undefined,
        mediaBaseUrlOverride: mediaBaseUrlOverride.trim() || undefined,
        apiToken: apiToken.trim() || undefined,
        tags,
        seo,
        gallery
      });
    }
    setLoading(false);
    navigate("/applications");
  };

  const handleRotateToken = async () => {
    if (!params.id) {
      return;
    }
    setLoading(true);
    const response = await client.post<Application>(`/api/v1/admin/applications/${params.id}/token/rotate`);
    setApiToken(response.data.apiToken ?? "");
    setLoading(false);
  };

  const handleRevokeToken = async () => {
    if (!params.id) {
      return;
    }
    setLoading(true);
    const response = await client.post<Application>(`/api/v1/admin/applications/${params.id}/token/revoke`);
    setApiToken(response.data.apiToken ?? "");
    setLoading(false);
  };

  const title = mode === "create" ? "New Application" : "Edit Application";
  const subtitle =
    mode === "create"
      ? "Create a new application for your content platform."
      : "Update application details.";

  return (
    <Card className="page-card">
      <div className="page-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        </div>
      </div>

      <Form layout="vertical" onSubmitCapture={handleSubmit} style={{ maxWidth: 600 }}>
        {mode === "create" && (
          <Form.Item label="Application ID (optional)">
            <Input
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              placeholder="UUID (leave empty to auto-generate)"
            />
          </Form.Item>
        )}
        {mode === "edit" && (
          <Form.Item label="Application ID">
            <Input value={applicationId} readOnly />
          </Form.Item>
        )}
        <Form.Item label="Name" required>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="App name" />
        </Form.Item>
        <Form.Item label="Description">
          <Input.TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </Form.Item>
        <Form.Item label="Status">
          <Select
            value={status}
            onChange={(value) => setStatus(value)}
            options={[
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" }
            ]}
          />
        </Form.Item>
        <Form.Item label="Media Policy">
          <Select
            value={mediaPolicy}
            onChange={(value) => setMediaPolicy(value)}
            options={[
              { value: "public-via-gateway", label: "Public via gateway" },
              { value: "domain-locked", label: "Domain locked" },
              { value: "jwt-required", label: "JWT required (future)" }
            ]}
          />
        </Form.Item>
        <Form.Item label="Allowed Domains">
          <Input
            value={allowedDomains.join(", ")}
            onChange={(event) =>
              setAllowedDomains(
                event.target.value
                  .split(",")
                  .map((domain) => domain.trim())
                  .filter(Boolean)
              )
            }
            placeholder="app1.com, www.app1.com"
          />
        </Form.Item>
        <Form.Item label="Rate Limit Policy (JSON)">
          <Input.TextArea
            value={rateLimitPolicy}
            onChange={(event) => setRateLimitPolicy(event.target.value)}
            rows={4}
            placeholder='{"windowMs":60000,"max":1000}'
          />
        </Form.Item>
        <Form.Item label="API Token">
          <Input
            value={apiToken}
            onChange={(event) => setApiToken(event.target.value)}
            placeholder="Auto-generated if empty"
          />
        </Form.Item>
        <Form.Item label="Website URL">
          <Input
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://example.com"
          />
        </Form.Item>
        <Card size="small" title="Base URL Overrides" style={{ marginBottom: 16 }}>
          <Form.Item label="Public Base URL Override">
            <Input
              value={publicBaseUrlOverride}
              onChange={(event) => setPublicBaseUrlOverride(event.target.value)}
              placeholder="https://consumer-domain.com"
            />
          </Form.Item>
          <Form.Item label="Media Base URL Override">
            <Input
              value={mediaBaseUrlOverride}
              onChange={(event) => setMediaBaseUrlOverride(event.target.value)}
              placeholder="https://media.consumer-domain.com"
            />
          </Form.Item>
        </Card>
        {mode === "edit" && (
          <Card size="small" title="Token Management" style={{ marginBottom: 16 }}>
            <Space>
              <Button onClick={handleRotateToken} loading={loading}>
                Rotate Token
              </Button>
              <Button danger onClick={handleRevokeToken} loading={loading}>
                Revoke Token
              </Button>
            </Space>
          </Card>
        )}
        <Card size="small" title="Tags & Categories" style={{ marginBottom: 16 }}>
          <Form.Item label="Tags">
            <Input
              value={tagsInput}
              onChange={(event) =>
                setTags(
                  event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                )
              }
              placeholder="news, fintech, growth"
            />
          </Form.Item>
        </Card>
        <Card size="small" title="SEO" style={{ marginBottom: 16 }}>
          <Form.Item label="Meta title">
            <Input value={seo.metaTitle ?? ""} onChange={(event) => updateSeo("metaTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label="Meta description">
            <Input.TextArea
              value={seo.metaDescription ?? ""}
              onChange={(event) => updateSeo("metaDescription", event.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Meta keywords">
            <Input
              value={(seo.metaKeywords ?? []).join(", ")}
              onChange={(event) =>
                updateSeo(
                  "metaKeywords",
                  event.target.value
                    .split(",")
                    .map((keyword) => keyword.trim())
                    .filter(Boolean)
                )
              }
              placeholder="keyword1, keyword2"
            />
          </Form.Item>
          <Form.Item label="Canonical URL">
            <Input value={seo.canonicalUrl ?? ""} onChange={(event) => updateSeo("canonicalUrl", event.target.value)} />
          </Form.Item>
          <Form.Item label="Robots">
            <Space>
              <Button
                type={seo.noIndex ? "primary" : "default"}
                onClick={() => updateSeo("noIndex", !seo.noIndex)}
              >
                No index
              </Button>
              <Button
                type={seo.noFollow ? "primary" : "default"}
                onClick={() => updateSeo("noFollow", !seo.noFollow)}
              >
                No follow
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="Open Graph title">
            <Input value={seo.ogTitle ?? ""} onChange={(event) => updateSeo("ogTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label="Open Graph description">
            <Input.TextArea
              value={seo.ogDescription ?? ""}
              onChange={(event) => updateSeo("ogDescription", event.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Open Graph image URL">
            <Input value={seo.ogImage ?? ""} onChange={(event) => updateSeo("ogImage", event.target.value)} />
          </Form.Item>
          <Form.Item label="Twitter title">
            <Input value={seo.twitterTitle ?? ""} onChange={(event) => updateSeo("twitterTitle", event.target.value)} />
          </Form.Item>
          <Form.Item label="Twitter description">
            <Input.TextArea
              value={seo.twitterDescription ?? ""}
              onChange={(event) => updateSeo("twitterDescription", event.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Twitter image URL">
            <Input value={seo.twitterImage ?? ""} onChange={(event) => updateSeo("twitterImage", event.target.value)} />
          </Form.Item>
          <Form.Item label="Schema JSON-LD">
            <Input.TextArea
              value={seo.schemaJsonLd ?? ""}
              onChange={(event) => updateSeo("schemaJsonLd", event.target.value)}
              rows={4}
            />
          </Form.Item>
        </Card>
        <Card size="small" title="Image Gallery" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {gallery.map((item, index) => (
              <Card key={`${item.url}-${index}`} size="small" style={{ background: "#fafafa" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Input
                    placeholder="Image URL"
                    value={item.url}
                    onChange={(event) => updateGallery(index, { url: event.target.value })}
                  />
                  <Input
                    placeholder="Alt text"
                    value={item.alt ?? ""}
                    onChange={(event) => updateGallery(index, { alt: event.target.value })}
                  />
                  <Input
                    placeholder="Caption"
                    value={item.caption ?? ""}
                    onChange={(event) => updateGallery(index, { caption: event.target.value })}
                  />
                  <Button danger onClick={() => removeGalleryItem(index)}>
                    Remove
                  </Button>
                </Space>
              </Card>
            ))}
            <Button type="dashed" onClick={addGalleryItem}>
              Add Image
            </Button>
          </Space>
        </Card>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!name.trim()}>
            Save
          </Button>
          <Button onClick={() => navigate("/applications")} disabled={loading}>
            Cancel
          </Button>
        </Space>
      </Form>
    </Card>
  );
};
