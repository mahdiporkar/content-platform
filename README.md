# content-platform

Multi-tenant content platform built with NestJS, PostgreSQL, and MinIO, with an Admin panel (React) and demo consumer app (Next.js).

![Architecture Diagram](./docs/architecture.png)

## Architecture Docs

- ERD, API Map, and Service Dependency Graph: [`docs/architecture/README.md`](docs/architecture/README.md)
- Swagger content delivery scenario: [`docs/swagger-content-delivery.md`](docs/swagger-content-delivery.md)

## Runtime Services

- Backend API: `http://localhost:3001`
- Admin UI: `http://localhost:5173`
- Demo UI: `http://localhost:3003`
- PostgreSQL: `localhost:5432`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

## Content Access Architecture

The platform is multi-tenant. Each tenant or consumer system is represented by an `applicationId`.

### Admin Plane

- Admin users sign in to the admin panel with a Bearer JWT.
- Each admin user can be assigned to one or more application ids.
- Non-super-admin users can only manage content for the application ids assigned to them.
- Admin APIs receive `applicationId` in the request body, query string, or admin route where needed, and the backend checks it against the authenticated user's allowed applications.
- Content, media assets, collections, sitemap settings, analytics, and audit records are stored with the owning `applicationId`.

### Consumer Server Plane

Consumer websites do not expose platform credentials to visitors. The consumer server stores:

```bash
CONTENT_PLATFORM_API_BASE_URL=http://localhost:3001
CONTENT_PLATFORM_APPLICATION_ID=<application-id>
CONTENT_PLATFORM_API_TOKEN=<application-token>
```

The consumer server fetches published content from the delivery API with headers:

```http
X-Application-Id: <application-id>
X-Application-Token: <application-token>
```

Application API tokens do not currently expire automatically. A token remains valid until one of these events happens:

- the application token is rotated with `POST /api/v1/admin/applications/{id}/token/rotate`
- the application token is revoked with `POST /api/v1/admin/applications/{id}/token/revoke`
- the application is suspended

The platform stores token hash/salt material, not the raw token. Newly generated or rotated raw tokens are shown once in the admin response, so consumer servers should store them as server-side secrets.

Preferred delivery routes read the application id only from headers:

```http
GET /api/v1/content
GET /api/v1/content/posts
GET /api/v1/content/articles
GET /api/v1/content/videos
GET /api/v1/content/gallery
GET /api/v1/content/posts/{slug}
GET /api/v1/content/articles/{slug}
GET /api/v1/content/videos/{id}
GET /api/v1/content/collections/{slug}
POST /api/v1/content/events/view
POST /api/v1/content/media/{mediaId}/access
```

`applicationId` is intentionally not part of the delivery URL. This avoids duplicating tenant identity in both the URL and headers.

### Collections

A collection is a manually curated, ordered editorial placement for one application. It is different from a category or tag: tags group content automatically by metadata, while a collection lets an admin choose exactly which items appear, in what order, and how the frontend should present them.

Do not create separate concepts such as Slider, Hero, Carousel, Banner, or Featured Block. They are all represented as collections:

- `Collection`: editorial grouping, placement context, audience, presentation mode, fallback policy.
- `CollectionItem`: ordered placement item, display overrides, scheduling, link behavior, tracking metadata.
- `presentation.type`: frontend rendering behavior such as `slider`, `hero`, `grid`, or `banner`.

Typical examples:

- `homepage-featured`
- `main-slider`
- `recommended-posts`
- `landing-hero`
- `landing-banner`
- `war-articles`
- `latest-magical-bank`

A collection can contain mixed content types, including posts, articles, videos, galleries, images, and fully custom banner/slide items.

Each collection has:

- `applicationId`: the owning tenant/application.
- `slug`: the delivery identifier, for example `homepage-featured`.
- `title` and optional `description`.
- `allowedTypes`: optional restriction for which content types can be added.
- `maxItems`: optional item limit.
- `isPublic`: whether the collection is available through delivery APIs.
- `status`: `draft`, `published`, or `archived`. Public APIs only expose published collections.
- `priority`: numeric priority for editorial/front-end ordering.
- `presentation`: rendering intent, for example `{ "type": "slider", "config": { "autoplay": true } }`.
- `placement`: intended page/section/device metadata, for example `{ "page": "home", "section": "hero", "device": "all" }`.
- `fallback`: optional automatic fallback when no valid items are active, for example `{ "enabled": true, "source": "latest", "limit": 10 }`.
- `audience`: targeting metadata such as locale or user segment.
- `metadata`: campaign and analytics keys.
- ordered items with a `position` field.

Each collection item can be either:

- `type: "content"`: references an existing content entity with `contentType` and `contentId`.
- `type: "custom"`: a standalone banner/slide item with display data and link metadata.

Collection items also support:

- `isActive`
- `startsAt` and `endsAt`
- `display` overrides such as title, subtitle, image, mobile image, video, badge text, and CTA label
- `link` metadata such as internal URL, external URL, content link, target, rel, and tracking key
- item-level campaign and analytics metadata

The link belongs to `CollectionItem`, not to the original content. The same article can link to the article page in one collection, to a campaign page in a slider, and to a signup form in a landing banner.

Use collections when a consumer website needs editorial control. For example, a landing page can show a "Featured Posts" or "Main Slider" row where the admin chooses the exact posts and articles, instead of always showing the newest published content.

Delivery examples:

```http
GET /api/v1/content?collection=homepage-featured
GET /api/v1/content/collections/homepage-featured
```

The first endpoint filters the normal content feed by collection. The second endpoint returns the collection metadata and its ordered items. Public delivery only returns collections where `isPublic` is enabled.

Public delivery also filters out:

- draft or archived collections
- inactive items
- expired items
- scheduled items whose `startsAt` is in the future

Existing collections remain valid. Missing fields default to:

- `status: "draft"`
- `priority: 0`
- `presentation: { "type": "list" }`
- `fallback: { "enabled": false }`
- `placement.device: "all"` when placement is provided
- item `link: { "type": "none" }`

### Visitor Browser Plane

Visitors use normal public routes on the consumer website, for example:

```http
GET /posts
GET /posts/{slug}
GET /articles
GET /gallery
GET /videos
```

The visitor browser receives rendered content and public media URLs only. It never receives `X-Application-Token`.

### Media Proxy

MinIO is private storage. Delivery JSON and rendered HTML must not expose direct MinIO URLs or the MinIO port.

Media URLs returned by the content platform use the backend proxy:

```http
http://localhost:3001/media/{applicationId}/...
```

The browser requests that proxy URL. The backend `MediaGatewayController` validates the application, applies domain policy when `Origin` or `Referer` is present, reads the object from MinIO internally, and streams it back to the browser.

Set the public content platform base URL to the externally reachable backend/proxy origin:

```bash
CONTENT_PLATFORM_BASE_URL=http://localhost:3001
PUBLIC_BASE_URL=http://localhost:3001
MEDIA_BASE_PATH=/media
```

Do not set public media URLs to MinIO, such as `http://localhost:9000`, for browser-facing delivery.

## Quick Start

```bash
npm run dev:all
```

For the demo consumer app, set these server-side environment variables so visitor routes can fetch content without exposing credentials in the browser URL:

```bash
CONTENT_PLATFORM_API_BASE_URL=http://localhost:3001
CONTENT_PLATFORM_APPLICATION_ID=<application-id>
CONTENT_PLATFORM_API_TOKEN=<application-token>
```

Or with Docker:

```bash
docker compose up --build
```
