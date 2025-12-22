export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PageResponse<T> = {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type Post = {
  id: string;
  applicationId: string;
  title: string;
  slug: string;
  content: string;
  status: ContentStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Article = {
  id: string;
  applicationId: string;
  title: string;
  slug: string;
  content: string;
  status: ContentStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Video = {
  id: string;
  applicationId: string;
  title: string;
  description?: string | null;
  status: ContentStatus;
  publishedAt?: string | null;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  presignedUrl?: string | null;
};
