import client from "./client";
import type { MediaAsset, MediaReference, MediaUploadResponse, PageResponse } from "../types";

export type MediaKind = "image" | "video" | "other";
export type MediaState = "ACTIVE" | "TRASH";

export const uploadMedia = async (
  file: File,
  applicationId: string,
  kind: MediaKind
): Promise<MediaUploadResponse> => {
  const payload = new FormData();
  payload.append("file", file);
  payload.append("applicationId", applicationId);
  payload.append("kind", kind);

  const response = await client.post<MediaUploadResponse>("/api/v1/admin/media/upload", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

type ListMediaAssetsParams = {
  applicationId: string;
  kind?: MediaKind;
  state?: MediaState;
  search?: string;
  page?: number;
  size?: number;
};

export const listMediaAssets = async (params: ListMediaAssetsParams): Promise<PageResponse<MediaAsset>> => {
  const response = await client.get<PageResponse<MediaAsset>>("/api/v1/admin/media/library", {
    params: {
      applicationId: params.applicationId,
      kind: params.kind,
      state: params.state,
      search: params.search,
      page: params.page ?? 0,
      size: params.size ?? 24
    }
  });
  return response.data;
};

type ListAdminMediaParams = {
  applicationId: string;
  state?: MediaState;
  page?: number;
  size?: number;
};

export const listAdminMedia = async (params: ListAdminMediaParams): Promise<PageResponse<MediaAsset>> => {
  const response = await client.get<PageResponse<MediaAsset>>("/api/v1/admin/media", {
    params: {
      applicationId: params.applicationId,
      state: params.state ?? "TRASH",
      page: params.page ?? 0,
      size: params.size ?? 24
    }
  });
  return response.data;
};

export const trashMediaAsset = async (id: string, applicationId: string): Promise<MediaAsset> => {
  const response = await client.delete<MediaAsset>(`/api/v1/media/${id}`, {
    params: { applicationId }
  });
  return response.data;
};

export const restoreMediaAsset = async (id: string, applicationId: string): Promise<MediaAsset> => {
  const response = await client.post<MediaAsset>(`/api/v1/media/${id}/restore`, undefined, {
    params: { applicationId }
  });
  return response.data;
};

export const purgeMediaAsset = async (id: string, applicationId: string): Promise<MediaAsset> => {
  const response = await client.delete<MediaAsset>(`/api/v1/admin/media/${id}/purge`, {
    params: { applicationId }
  });
  return response.data;
};

export const listMediaReferences = async (id: string, applicationId: string): Promise<MediaReference[]> => {
  const response = await client.get<MediaReference[]>(`/api/v1/admin/media/${id}/references`, {
    params: { applicationId }
  });
  return response.data;
};
