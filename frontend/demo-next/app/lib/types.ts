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
};

export type Article = {
  id: string;
  applicationId: string;
  title: string;
  slug: string;
  content: string;
  status: ContentStatus;
  publishedAt?: string | null;
};

export type Video = {
  id: string;
  applicationId: string;
  title: string;
  description?: string | null;
  status: ContentStatus;
  presignedUrl?: string | null;
};
