import client from "./client";
import type { MediaAsset, MediaUploadResponse, PageResponse } from "../types";

export type MediaKind = "image" | "video" | "file";

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
  search?: string;
  page?: number;
  size?: number;
};

export const listMediaAssets = async (params: ListMediaAssetsParams): Promise<PageResponse<MediaAsset>> => {
  const response = await client.get<PageResponse<MediaAsset>>("/api/v1/admin/media/library", {
    params: {
      applicationId: params.applicationId,
      kind: params.kind,
      search: params.search,
      page: params.page ?? 0,
      size: params.size ?? 24
    }
  });
  return response.data;
};
