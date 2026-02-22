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
  deletedAt?: string | null;
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

export type MediaAssetKind = "image" | "video" | "file";

export type MediaAsset = {
  id: string;
  applicationId: string;
  kind: MediaAssetKind;
  state?: "ACTIVE" | "TRASH" | "PURGED";
  objectKey: string;
  originalName?: string | null;
  contentType: string;
  sizeBytes: number;
  mediaUrl: string;
  trashedAt?: string | null;
  purgedAt?: string | null;
  pinned?: boolean;
  refCount?: number;
  canPurge?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MediaReference = {
  id: string;
  applicationId: string;
  mediaAssetId: string;
  refType: string;
  refId: string;
  refField: string;
  createdAt: string;
};

export type ContentUsage = {
  refType: string;
  refId: string;
  refField: string;
  title: string | null;
  routePath: string | null;
  createdAt: string;
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
  deletedAt?: string | null;
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
  isPublic?: boolean;
  itemsCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CollectionItem = {
  id: string;
  collectionId: string;
  contentType: "post" | "article" | "video" | "image";
  contentId: string;
  position: number;
  title?: string | null;
  status?: ContentStatus | null;
  locale?: string | null;
  tags?: string[] | null;
  slug?: string | null;
  thumbnailUrl?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "super_admin" | "editor" | "publisher";
  status: "active" | "suspended";
  applicationIds: string[];
  systemPermissions: ("applications.manage" | "users.manage")[];
  servicePermissions: (
    | "posts.manage"
    | "articles.manage"
    | "images.manage"
    | "videos.manage"
    | "collections.manage"
    | "analytics.view"
  )[];
};
