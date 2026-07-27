export enum CollectionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum CollectionPresentationType {
  LIST = 'list',
  GRID = 'grid',
  SLIDER = 'slider',
  CAROUSEL = 'carousel',
  HERO = 'hero',
  BANNER = 'banner',
}

export enum CollectionPlacementDevice {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  ALL = 'all',
}

export enum CollectionFallbackSource {
  LATEST = 'latest',
  POPULAR = 'popular',
}

export enum CollectionItemType {
  CONTENT = 'content',
  CUSTOM = 'custom',
}

export enum CollectionItemLinkType {
  CONTENT = 'content',
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  NONE = 'none',
}

export type CollectionPresentation = {
  type: CollectionPresentationType;
  config?: Record<string, unknown>;
};

export type CollectionPlacement = {
  page?: string;
  section?: string;
  device?: CollectionPlacementDevice;
};

export type CollectionFallback = {
  enabled: boolean;
  source?: CollectionFallbackSource;
  limit?: number;
};

export type CollectionAudience = {
  locale?: string;
  segment?: 'guest' | 'logged-in' | 'vip' | string;
};

export type CollectionMetadata = {
  campaignKey?: string;
  analyticsKey?: string;
  defaultDisplayScopes?: string[];
};

export type CollectionItemDisplay = {
  titleOverride?: string;
  subtitleOverride?: string;
  descriptionOverride?: string;
  imageOverride?: string;
  mobileImageOverride?: string;
  videoOverride?: string;
  displayType?: 'default' | 'hero' | 'banner' | 'card' | 'inline' | 'background';
  mediaFit?: 'cover' | 'contain' | 'fill';
  mediaPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  videoPlayback?: 'inline' | 'background' | 'modal';
  badgeText?: string;
  ctaLabel?: string;
};

export type CollectionItemLink = {
  type: CollectionItemLinkType;
  contentId?: string;
  url?: string;
  target?: '_blank' | '_self';
  rel?: 'nofollow' | 'sponsored' | 'noopener';
  trackingKey?: string;
};

export type CollectionItemMetadata = {
  analyticsKey?: string;
  campaignKey?: string;
};
