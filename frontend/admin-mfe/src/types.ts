export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

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
  websiteUrl?: string | null;
  tags?: string[] | null;
  seo?: SeoMeta | null;
  gallery?: GalleryImage[] | null;
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
  slug: string;
  content: string;
  bannerUrl?: string | null;
  tags?: string[] | null;
  seo?: SeoMeta | null;
  gallery?: GalleryImage[] | null;
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
  bannerUrl?: string | null;
  tags?: string[] | null;
  seo?: SeoMeta | null;
  gallery?: GalleryImage[] | null;
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
  tags?: string[] | null;
  seo?: SeoMeta | null;
  gallery?: GalleryImage[] | null;
  status: ContentStatus;
  publishedAt?: string | null;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  presignedUrl?: string | null;
};

export type MediaUploadResponse = {
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  url: string;
};
