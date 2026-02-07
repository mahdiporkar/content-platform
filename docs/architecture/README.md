# Architecture Reference

This document contains the current backend architecture reference for the active NestJS implementation.

## ERD

```mermaid
erDiagram
  applications {
    varchar id PK
    varchar name
    text description
    enum status
    enum media_policy
    text[] allowed_domains
    varchar api_token
    timestamptz token_created_at
    timestamptz last_used_at
    varchar website_url
    varchar public_base_url_override
    varchar media_base_url_override
    jsonb rate_limit_policy
    text[] tags
    jsonb seo
    jsonb gallery
    timestamptz created_at
    timestamptz updated_at
  }

  admin_users {
    varchar id PK
    varchar email UK
    varchar password_hash
    enum role
    enum status
  }

  admin_user_applications {
    varchar admin_user_id PK,FK
    varchar application_id PK,FK
  }

  posts {
    varchar id PK
    varchar application_id FK
    varchar title
    text description
    varchar slug
    text content
    text banner_url
    varchar banner_key
    varchar locale
    text[] tags
    jsonb seo
    jsonb gallery
    enum status
    timestamptz published_at
    timestamptz scheduled_at
    bigint view_count
    timestamptz created_at
    timestamptz updated_at
  }

  articles {
    varchar id PK
    varchar application_id FK
    varchar title
    text description
    varchar slug
    text content
    text banner_url
    varchar banner_key
    varchar locale
    text[] tags
    jsonb seo
    jsonb gallery
    enum status
    timestamptz published_at
    timestamptz scheduled_at
    bigint view_count
    timestamptz created_at
    timestamptz updated_at
  }

  videos {
    varchar id PK
    varchar application_id FK
    varchar title
    text description
    varchar locale
    text[] tags
    jsonb seo
    jsonb gallery
    enum status
    timestamptz published_at
    timestamptz scheduled_at
    bigint view_count
    varchar object_key
    varchar poster_key
    int duration_seconds
    int width
    int height
    varchar content_type
    bigint size_bytes
    text alt_text
    timestamptz created_at
    timestamptz updated_at
  }

  images {
    varchar id PK
    varchar application_id FK
    varchar title
    text description
    varchar locale
    text[] tags
    jsonb seo
    jsonb gallery
    enum status
    timestamptz published_at
    timestamptz scheduled_at
    bigint view_count
    varchar object_key
    varchar content_type
    bigint size_bytes
    int width
    int height
    text alt_text
    timestamptz created_at
    timestamptz updated_at
  }

  collections {
    varchar id PK
    varchar application_id FK
    varchar slug
    varchar title
    text description
    text[] allowed_types
    int max_items
    timestamptz created_at
    timestamptz updated_at
  }

  collection_items {
    varchar id PK
    varchar collection_id FK
    enum content_type
    varchar content_id
    int position
    timestamptz created_at
    timestamptz updated_at
  }

  audit_logs {
    varchar id PK
    varchar actor_id
    varchar actor_email
    varchar action
    varchar entity_type
    varchar entity_id
    jsonb metadata
    timestamptz created_at
  }

  view_events {
    varchar id PK
    varchar application_id FK
    varchar content_id
    enum content_type
    varchar locale
    timestamptz created_at
  }

  applications ||--o{ posts : has
  applications ||--o{ articles : has
  applications ||--o{ videos : has
  applications ||--o{ images : has
  applications ||--o{ collections : has
  applications ||--o{ view_events : tracks
  admin_users ||--o{ admin_user_applications : mapped
  applications ||--o{ admin_user_applications : mapped
  collections ||--o{ collection_items : contains
```

## API Map

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Admin login |
| GET | `/api/v1/admin/applications` | Admin JWT | List applications |
| GET | `/api/v1/admin/applications/:id` | Admin JWT | Get application |
| POST | `/api/v1/admin/applications` | Admin JWT | Create application |
| PUT | `/api/v1/admin/applications/:id` | Admin JWT | Update application |
| POST | `/api/v1/admin/applications/:id/token/rotate` | Admin JWT | Rotate application token |
| POST | `/api/v1/admin/applications/:id/token/revoke` | Admin JWT | Revoke application token |
| DELETE | `/api/v1/admin/applications/:id` | Admin JWT | Delete application |
| GET | `/api/v1/admin/users` | Admin JWT | List admin users |
| GET | `/api/v1/admin/users/:id` | Admin JWT | Get admin user |
| POST | `/api/v1/admin/users` | Admin JWT | Create admin user |
| PUT | `/api/v1/admin/users/:id` | Admin JWT | Update admin user |
| DELETE | `/api/v1/admin/users/:id` | Admin JWT | Delete admin user |
| POST | `/api/v1/admin/posts` | Admin JWT | Create post |
| PUT | `/api/v1/admin/posts/:id` | Admin JWT | Update post |
| PATCH | `/api/v1/admin/posts/:id/status` | Admin JWT | Change post status |
| GET | `/api/v1/admin/posts` | Admin JWT | List posts |
| POST | `/api/v1/admin/articles` | Admin JWT | Create article |
| PUT | `/api/v1/admin/articles/:id` | Admin JWT | Update article |
| PATCH | `/api/v1/admin/articles/:id/status` | Admin JWT | Change article status |
| GET | `/api/v1/admin/articles` | Admin JWT | List articles |
| POST | `/api/v1/admin/videos/upload` | Admin JWT | Upload video |
| GET | `/api/v1/admin/videos/:id` | Admin JWT | Get video |
| PUT | `/api/v1/admin/videos/:id` | Admin JWT | Update video |
| PATCH | `/api/v1/admin/videos/:id/status` | Admin JWT | Change video status |
| GET | `/api/v1/admin/videos` | Admin JWT | List videos |
| POST | `/api/v1/admin/images/upload` | Admin JWT | Upload image |
| GET | `/api/v1/admin/images/:id` | Admin JWT | Get image |
| PUT | `/api/v1/admin/images/:id` | Admin JWT | Update image |
| PUT | `/api/v1/admin/images/:id/status` | Admin JWT | Change image status |
| GET | `/api/v1/admin/images` | Admin JWT | List images |
| POST | `/api/v1/admin/media/upload` | Admin JWT | Upload generic media |
| GET | `/api/v1/admin/collections` | Admin JWT | List collections |
| GET | `/api/v1/admin/collections/:id` | Admin JWT | Get collection |
| POST | `/api/v1/admin/collections` | Admin JWT | Create collection |
| PUT | `/api/v1/admin/collections/:id` | Admin JWT | Update collection |
| DELETE | `/api/v1/admin/collections/:id` | Admin JWT | Delete collection |
| GET | `/api/v1/admin/collections/:id/items` | Admin JWT | List collection items |
| POST | `/api/v1/admin/collections/:id/items` | Admin JWT | Add collection item |
| DELETE | `/api/v1/admin/collections/:id/items/:itemId` | Admin JWT | Remove collection item |
| PUT | `/api/v1/admin/collections/:id/items/reorder` | Admin JWT | Reorder collection items |
| GET | `/api/v1/admin/analytics/top` | Admin JWT | Top content analytics |
| GET | `/api/v1/admin/analytics/timeline` | Admin JWT | View timeline analytics |
| GET | `/api/v1/public/:applicationId/posts` | App Token | Public posts |
| GET | `/api/v1/public/:applicationId/posts/:slug` | App Token | Public post detail |
| GET | `/api/v1/public/:applicationId/articles` | App Token | Public articles |
| GET | `/api/v1/public/:applicationId/articles/:slug` | App Token | Public article detail |
| GET | `/api/v1/public/:applicationId/videos` | App Token | Public videos |
| GET | `/api/v1/public/:applicationId/videos/:id` | App Token | Public video detail |
| GET | `/api/v1/public/:applicationId/gallery` | App Token | Public gallery |
| GET | `/api/v1/public/:applicationId/gallery/:index` | App Token | Public gallery item |
| GET | `/delivery/v1/content` | App Token + Domain Policy | Delivery feed |
| GET | `/delivery/v1/collections/:slug` | App Token + Domain Policy | Delivery collection |
| POST | `/delivery/v1/events/view` | App Token | Register content view |
| GET | `/media/:appId/*` | Domain Policy | Media gateway stream |

## Service Dependency Graph

```mermaid
flowchart LR
  AuthController --> AuthService
  AdminApplicationController --> AdminApplicationService
  AdminUserController --> AdminUserService
  AdminPostController --> AdminPostService
  AdminArticleController --> AdminArticleService
  AdminVideoController --> AdminVideoService
  AdminImageController --> AdminImageService
  AdminMediaController --> MinioService
  AdminMediaController --> BaseUrlService
  AdminCollectionController --> AdminCollectionService
  AdminAnalyticsController --> AdminAnalyticsService
  PublicContentController --> PublicContentService
  DeliveryContentController --> DeliveryContentService
  DeliveryContentController --> DomainPolicyService
  MediaGatewayController --> MinioService
  MediaGatewayController --> DomainPolicyService

  JwtAuthGuard --> JwtTokenService
  ApplicationTokenGuard --> ApplicationRepo[(Application Repository)]

  AuthService --> AdminUserRepo[(AdminUser Repository)]
  AuthService --> JwtTokenService

  AdminApplicationService --> ApplicationRepo
  AdminApplicationService --> AuditLogService

  AdminUserService --> AdminUserRepo
  AdminUserService --> AdminUserApplicationRepo[(AdminUserApplication Repository)]

  AdminPostService --> PostRepo[(Post Repository)]
  AdminArticleService --> ArticleRepo[(Article Repository)]

  AdminVideoService --> VideoRepo[(Video Repository)]
  AdminVideoService --> MinioService
  AdminVideoService --> BaseUrlService
  AdminVideoService --> ApplicationRepo

  AdminImageService --> ImageRepo[(Image Repository)]
  AdminImageService --> MinioService
  AdminImageService --> BaseUrlService
  AdminImageService --> ApplicationRepo

  PublicContentService --> PostRepo
  PublicContentService --> ArticleRepo
  PublicContentService --> VideoRepo
  PublicContentService --> ApplicationRepo
  PublicContentService --> BaseUrlService

  DeliveryContentService --> ArticleRepo
  DeliveryContentService --> VideoRepo
  DeliveryContentService --> ImageRepo
  DeliveryContentService --> CollectionRepo[(Collection Repository)]
  DeliveryContentService --> CollectionItemRepo[(CollectionItem Repository)]
  DeliveryContentService --> ViewEventRepo[(ViewEvent Repository)]
  DeliveryContentService --> BaseUrlService

  AdminCollectionService --> CollectionRepo
  AdminCollectionService --> CollectionItemRepo
  AdminCollectionService --> AuditLogService

  AdminAnalyticsService --> ArticleRepo
  AdminAnalyticsService --> VideoRepo
  AdminAnalyticsService --> ImageRepo
  AdminAnalyticsService --> ViewEventRepo

  AuditLogService --> AuditLogRepo[(AuditLog Repository)]
  SeedDataService --> ApplicationRepo
  SeedDataService --> AdminUserRepo
  SeedDataService --> AdminUserApplicationRepo
```
