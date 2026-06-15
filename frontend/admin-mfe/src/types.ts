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
  readingTimeMinutes?: number;
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
  readingTimeMinutes?: number;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type DynamicPage = {
  id: string;
  applicationId: string;
  title: string;
  slug: string;
  content: string;
  html?: string | null;
  coverImage?: string | null;
  languageCode: string;
  status: ContentStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  parentId?: string | null;
  sortOrder?: number | null;
  showInMenu: boolean;
  publishedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MenuLocation = "HEADER" | "FOOTER" | "SIDEBAR" | "MOBILE";
export type MenuStatus = "ACTIVE" | "INACTIVE";
export type MenuItemType = "PAGE" | "ARTICLE" | "POST" | "GALLERY" | "CUSTOM_URL" | "EXTERNAL_URL" | "GROUP";
export type MenuItemTarget = "SELF" | "BLANK";

export type MenuItem = {
  id: string;
  menuId: string;
  parentId?: string | null;
  title: string;
  itemType: MenuItemType;
  referenceId?: string | null;
  url?: string | null;
  target: MenuItemTarget;
  icon?: string | null;
  cssClass?: string | null;
  sortOrder: number;
  isVisible: boolean;
  children: MenuItem[];
  createdAt: string;
  updatedAt: string;
};

export type SiteMenu = {
  id: string;
  applicationId: string;
  code: string;
  title: string;
  location: MenuLocation;
  languageCode: string;
  status: MenuStatus;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
};

export type MenuContentCandidate = {
  id: string;
  type: "PAGE" | "POST" | "GALLERY";
  title: string;
  slug: string;
  url: string;
  alreadyInMenu: boolean;
  publishedAt?: string | null;
  updatedAt: string;
};

export type GalleryContent = {
  id: string;
  applicationId: string;
  title: string;
  description?: string | null;
  slug: string;
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

export type MediaAssetKind = "image" | "video" | "other";

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

export type MediaVariantPurpose =
  | "default"
  | "thumbnail"
  | "hero"
  | "cover"
  | "gallery"
  | "og_image"
  | "preview";

export type MediaVariantSizeKey = "xs" | "sm" | "md" | "lg" | "xl";
export type MediaVariantDevice = "mobile" | "tablet" | "desktop";

export type MediaVariant = {
  id: string;
  mediaId: string;
  applicationId: string;
  purpose: MediaVariantPurpose;
  sizeKey?: MediaVariantSizeKey | null;
  minWidth?: number | null;
  maxWidth?: number | null;
  device?: MediaVariantDevice | null;
  format?: string | null;
  objectKey: string;
  fileUrl?: string | null;
  url: string;
  isDefault: boolean;
  sortOrder: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  bitrate?: number | null;
  sizeBytes: number;
  createdAt: string;
  updatedAt?: string | null;
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
  status?: "draft" | "published" | "archived";
  priority?: number;
  presentation?: {
    type: "list" | "grid" | "slider" | "carousel" | "hero" | "banner";
    config?: Record<string, unknown>;
  } | null;
  placement?: {
    page?: string;
    section?: string;
    device?: "desktop" | "mobile" | "all";
  } | null;
  fallback?: {
    enabled: boolean;
    source?: "latest" | "popular";
    limit?: number;
  } | null;
  audience?: {
    locale?: string;
    segment?: "guest" | "logged-in" | "vip" | string;
  } | null;
  metadata?: {
    campaignKey?: string;
    analyticsKey?: string;
  } | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  itemsCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CollectionItem = {
  id: string;
  collectionId: string;
  contentType: "post" | "article" | "video" | "gallery" | "image" | null;
  contentId: string | null;
  type?: "content" | "custom";
  position: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  display?: {
    titleOverride?: string;
    subtitleOverride?: string;
    descriptionOverride?: string;
    imageOverride?: string;
    mobileImageOverride?: string;
    videoOverride?: string;
    displayType?: "default" | "hero" | "banner" | "card" | "inline" | "background";
    mediaFit?: "cover" | "contain" | "fill";
    mediaPosition?: "center" | "top" | "bottom" | "left" | "right";
    videoPlayback?: "inline" | "background" | "modal";
    badgeText?: string;
    ctaLabel?: string;
  } | null;
  link?: {
    type: "content" | "internal" | "external" | "none";
    contentId?: string;
    url?: string;
    target?: "_blank" | "_self";
    rel?: "nofollow" | "sponsored" | "noopener";
    trackingKey?: string;
  } | null;
  metadata?: {
    analyticsKey?: string;
    campaignKey?: string;
  } | null;
  title?: string | null;
  status?: ContentStatus | null;
  locale?: string | null;
  tags?: string[] | null;
  slug?: string | null;
  thumbnailUrl?: string | null;
  publishedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "super_admin" | "system_admin" | "editor" | "publisher";
  status: "active" | "suspended";
  applicationIds: string[];
  systemPermissions: ("applications.manage" | "users.manage")[];
  servicePermissions: (
    | "posts.manage"
    | "articles.manage"
    | "media.manage"
    | "pages.manage"
    | "menus.manage"
    | "galleries.manage"
    | "images.manage"
    | "videos.manage"
    | "collections.manage"
    | "analytics.view"
  )[];
};

export type SitemapRegenStrategy = "on_publish" | "scheduled" | "manual";
export type SitemapLastmodPolicy = "updatedAt" | "publishedAt";
export type SitemapValidateStatus = "OK" | "ERROR" | "WARNING";
export type SitemapLastmodMode = "now" | "fixed_date" | "none";
export type SitemapChangefreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type SitemapSettings = {
  tenantId: string;
  enabled: boolean;
  baseUrl?: string | null;
  sitemapPath: string;
  cacheTtlSeconds: number;
  regenStrategy: SitemapRegenStrategy;
  createdAt: string;
  updatedAt: string;
};

export type SitemapTemplate = {
  id: string;
  tenantId: string;
  contentType: string;
  enabled: boolean;
  template?: string | null;
  lastmodPolicy: SitemapLastmodPolicy;
  defaultChangefreq?: SitemapChangefreq | null;
  defaultPriority?: number | null;
  validateStatus: SitemapValidateStatus;
  validateErrors?: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export type SitemapPreviewEntry = {
  contentId?: string | null;
  contentType: string;
  title?: string | null;
  finalUrl?: string | null;
  lastmod?: string | null;
  priority?: number | null;
  changefreq?: SitemapChangefreq | null;
  source: "template" | "override" | "manual";
  status: "OK" | "ERROR" | "WARNING";
  errors: string[];
  duplicate: boolean;
};

export type SitemapCustomUrl = {
  id: string;
  tenantId: string;
  pathOrUrl: string;
  enabled: boolean;
  lastmodMode: SitemapLastmodMode;
  lastmodValue?: string | null;
  changefreq?: SitemapChangefreq | null;
  priority?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};
