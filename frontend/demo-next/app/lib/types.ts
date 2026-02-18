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
  bannerUrl?: string | null;
  status: ContentStatus;
  publishedAt?: string | null;
};

export type Article = {
  id: string;
  applicationId: string;
  title: string;
  slug: string;
  content: string;
  bannerUrl?: string | null;
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

export type GalleryImage = {
  url: string;
  alt: string | null;
  caption: string | null;
};

export type DeliveryContent = {
  contentId: string;
  appId: string;
  type: string;
  title: string;
  description: string | null;
  slug: string | null;
  content: string | null;
  mediaUrl: string | null;
  posterUrl: string | null;
  altText: string | null;
  status: ContentStatus;
};
