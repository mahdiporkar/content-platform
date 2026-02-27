import client from "./client";
import type {
  SitemapCustomUrl,
  SitemapPreviewEntry,
  SitemapSettings,
  SitemapTemplate
} from "../types";

export const getSitemapSettings = async (applicationId: string): Promise<SitemapSettings> => {
  const response = await client.get<SitemapSettings>("/api/v1/admin/sitemap/settings", { params: { applicationId } });
  return response.data;
};

export const putSitemapSettings = async (
  applicationId: string,
  payload: {
    enabled: boolean;
    baseUrl?: string;
    sitemapPath?: string;
    cacheTtlSeconds?: number;
    regenStrategy?: "on_publish" | "scheduled" | "manual";
  }
): Promise<SitemapSettings> => {
  const response = await client.put<SitemapSettings>("/api/v1/admin/sitemap/settings", payload, {
    params: { applicationId }
  });
  return response.data;
};

export const listSitemapTemplates = async (applicationId: string): Promise<SitemapTemplate[]> => {
  const response = await client.get<SitemapTemplate[]>("/api/v1/admin/sitemap/templates", { params: { applicationId } });
  return response.data;
};

export const putSitemapTemplate = async (
  applicationId: string,
  contentType: string,
  payload: {
    enabled: boolean;
    template?: string;
    lastmodPolicy?: "updatedAt" | "publishedAt";
    defaultChangefreq?: string;
    defaultPriority?: number;
  }
): Promise<SitemapTemplate> => {
  const response = await client.put<SitemapTemplate>(
    `/api/v1/admin/sitemap/templates/${contentType}`,
    payload,
    { params: { applicationId } }
  );
  return response.data;
};

export const previewSitemap = async (
  applicationId: string,
  params?: { contentType?: string; limit?: number; offset?: number }
): Promise<{ total: number; items: SitemapPreviewEntry[] }> => {
  const response = await client.get<{ total: number; items: SitemapPreviewEntry[] }>("/api/v1/admin/sitemap/preview", {
    params: {
      applicationId,
      contentType: params?.contentType,
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0
    }
  });
  return response.data;
};

export const testSitemapUrl = async (
  applicationId: string,
  url: string
): Promise<{ ok: boolean; httpStatus?: number | null; errorMessage?: string | null }> => {
  const response = await client.post("/api/v1/admin/sitemap/test-url", { url }, { params: { applicationId } });
  return response.data;
};

export const putSitemapOverride = async (
  applicationId: string,
  contentType: string,
  contentId: string,
  payload: { customUrl?: string; excluded?: boolean; priorityOverride?: number; changefreqOverride?: string }
): Promise<void> => {
  await client.put(`/api/v1/admin/sitemap/override/${contentType}/${contentId}`, payload, {
    params: { applicationId }
  });
};

export const listSitemapCustomUrls = async (applicationId: string): Promise<SitemapCustomUrl[]> => {
  const response = await client.get<SitemapCustomUrl[]>("/api/v1/admin/sitemap/custom-urls", {
    params: { applicationId }
  });
  return response.data;
};

export const createSitemapCustomUrl = async (
  applicationId: string,
  payload: {
    pathOrUrl: string;
    enabled?: boolean;
    lastmodMode?: "now" | "fixed_date" | "none";
    lastmodValue?: string;
    changefreq?: string;
    priority?: number;
    notes?: string;
  }
): Promise<SitemapCustomUrl> => {
  const response = await client.post<SitemapCustomUrl>("/api/v1/admin/sitemap/custom-urls", payload, {
    params: { applicationId }
  });
  return response.data;
};

export const updateSitemapCustomUrl = async (
  applicationId: string,
  id: string,
  payload: {
    pathOrUrl: string;
    enabled?: boolean;
    lastmodMode?: "now" | "fixed_date" | "none";
    lastmodValue?: string;
    changefreq?: string;
    priority?: number;
    notes?: string;
  }
): Promise<SitemapCustomUrl> => {
  const response = await client.put<SitemapCustomUrl>(`/api/v1/admin/sitemap/custom-urls/${id}`, payload, {
    params: { applicationId }
  });
  return response.data;
};

export const deleteSitemapCustomUrl = async (applicationId: string, id: string): Promise<void> => {
  await client.delete(`/api/v1/admin/sitemap/custom-urls/${id}`, { params: { applicationId } });
};

