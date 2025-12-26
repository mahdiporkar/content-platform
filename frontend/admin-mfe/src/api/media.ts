import client from "./client";
import type { MediaUploadResponse } from "../types";

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
