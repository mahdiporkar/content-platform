export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";

export type SeoMeta = {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schemaJsonLd?: string;
};

export type GalleryImage = {
  url: string;
  alt?: string;
  caption?: string;
};

export type Application = {
  id: string;
  name: string;
  description?: string | null;
  status?: "active" | "suspended";
  rateLimitPolicy?: Record<string, unknown> | null;
  mediaPolicy?: "public-via-gateway" | "domain-locked" | "jwt-required";
  allowedDomains?: string[] | null;
  websiteUrl?: string | null;
  publicBaseUrlOverride?: string | null;
  mediaBaseUrlOverride?: string | null;
  tags?: string[] | null;
  seo?: SeoMeta | null;
  gallery?: GalleryImage[] | null;
  apiToken?: string | null;
  tokenCreatedAt?: string | null;
  lastUsedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

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
  description?: string | null;
  slug: string;
  content: string;
  bannerUrl?: string | null;
  bannerKey?: string | null;
  locale?: string | null;
  tags?: string[] | null;
  seo?: SeoMeta | null;
  gallery?: GalleryImage[] | null;
  status: ContentStatus;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type Article = {
  id: string;
  applicationId: string;
  title: string;
  description?: string | null;
  slug: string;
  content: string;
  bannerUrl?: string | null;
  bannerKey?: string | null;
  locale?: string | null;
  tags?: string[] | null;
  seo?: SeoMeta | null;
  gallery?: GalleryImage[] | null;
  status: ContentStatus;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type Video = {
  id: string;
  applicationId: string;
  title: string;
  description?: string | null;
  locale?: string | null;
  tags?: string[] | null;
  seo?: SeoMeta | null;
  gallery?: GalleryImage[] | null;
  status: ContentStatus;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  viewCount?: number;
  objectKey: string;
  posterKey?: string | null;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  contentType: string;
  sizeBytes: number;
  altText?: string | null;
  createdAt: string;
  updatedAt: string;
  mediaUrl?: string | null;
  presignedUrl?: string | null;
};

export type MediaUploadResponse = {
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  mediaUrl?: string;
};

export type ImageContent = {
  id: string;
  applicationId: string;
  title: string;
  description?: string | null;
  locale?: string | null;
  tags?: string[] | null;
  seo?: SeoMeta | null;
  gallery?: GalleryImage[] | null;
  status: ContentStatus;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  viewCount?: number;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  createdAt: string;
  updatedAt: string;
  mediaUrl?: string | null;
};

export type Collection = {
  id: string;
  applicationId: string;
  slug: string;
  title: string;
  description?: string | null;
  allowedTypes?: string[] | null;
  maxItems?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CollectionItem = {
  id: string;
  collectionId: string;
  contentType: "article" | "video" | "image";
  contentId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "super_admin" | "editor" | "publisher";
  status: "active" | "suspended";
  applicationIds: string[];
};
