# content-platform

Multi-tenant content platform built with NestJS, PostgreSQL, and MinIO, with an Admin panel (React) and demo consumer app (Next.js).

[فارسی](README.fa.md)

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

### Pages and Menus

Pages and menus are tenant-scoped content management features. They are available in both backend implementations, so the admin panel can work with either the NestJS backend or the Java backend without changing the frontend contract.

Use pages for standalone website routes such as:

- `/fa/about`
- `/fa/contact`
- `/fa/about-me-2`
- `/en/about`

Use menus to define the navigation structure that consumer websites render. A menu item can point to a static route, a managed page, an article, a post, a gallery, or an external URL.

This lets a consumer website add new screens without changing the menu code. For example, if the frontend team adds a new component for `/fa/about-me-2`, an admin only needs to create or update the menu item in content-platform and set the route. The consumer app receives the new item through the menu delivery API and can show the route in the browser.

Menu items returned by the public menu API include a `dynamic` flag:

- `dynamic: false`: the route is handled by the consumer app as a normal static route.
- `dynamic: true`: the route is backed by content-platform content. The consumer app should load the page/content body from content-platform and render it inside its own layout and visual style.

Admin APIs:

```http
POST /api/v1/admin/pages
PUT /api/v1/admin/pages/{id}
PATCH /api/v1/admin/pages/{id}/status
GET /api/v1/admin/pages/{id}
GET /api/v1/admin/pages?applicationId={applicationId}

POST /api/v1/admin/menus
PUT /api/v1/admin/menus/{id}
PATCH /api/v1/admin/menus/{id}/status
DELETE /api/v1/admin/menus/{id}
GET /api/v1/admin/menus/{id}
GET /api/v1/admin/menus?applicationId={applicationId}
POST /api/v1/admin/menus/{id}/items
PUT /api/v1/admin/menus/{id}/items/layout
PUT /api/v1/admin/menus/{id}/items/{itemId}
DELETE /api/v1/admin/menus/{id}/items/{itemId}
GET /api/v1/admin/menus/{id}/published-content
POST /api/v1/admin/menus/{id}/sync-published
```

Public delivery APIs:

```http
GET /api/v1/content/pages
GET /api/v1/content/pages/slugs
GET /api/v1/content/pages/{languageCode}/{slug}
GET /api/v1/content/menus/location/{languageCode}/{location}
GET /api/v1/content/menus/{languageCode}/{code}
```

The public delivery APIs use the same consumer headers as the rest of the delivery plane:

```http
X-Application-Id: <application-id>
X-Application-Token: <application-token>
```

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

### CORS

Configure allowed admin frontend origins as a comma-separated environment variable:

```bash
CORS_ALLOWED_ORIGINS=http://localhost:3002,http://localhost:5173
```

Production example:

```bash
CORS_ALLOWED_ORIGINS=https://cms.magigateac.com
```

Requests without an `Origin` header, such as curl and health checks, remain allowed. In production, browser cross-origin requests are rejected when `CORS_ALLOWED_ORIGINS` is not configured.

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
## Tenant Route Registry and Menu Synchronization

Content Platform never seeds or hardcodes routes belonging to a real tenant. A tenant declares its code-defined routes, while the content administrator remains responsible for selecting routes and arranging the final menu.

### Route manifest is not the final menu

The manifest only describes routes implemented by tenant code. It does not define menu hierarchy, ordering, visibility, location, or status. Final menus remain database records managed through the CMS.

```json
{
  "source": "tenant-web",
  "replaceMissing": true,
  "routes": [
    {
      "key": "about",
      "path": "/{locale}/about",
      "titles": {
        "fa": "درباره ما",
        "en": "About"
      },
      "icon": "user",
      "cssClass": "nav-about"
    }
  ]
}
```

`applicationId + source + key` is unique. Repeating the same request updates the existing route and never creates duplicates.

### Automated tenant synchronization

1. Rotate a management token from the application editor or call:
   `POST /api/v1/admin/applications/:id/management-token/rotate`
2. Store the returned token only in a tenant backend, deployment environment, or CI secret.
3. Send the manifest to:

```http
PUT /api/v1/management/navigation/routes
X-Application-Id: <application-id>
Authorization: Bearer <management-token>
Content-Type: application/json
```

The tenant may run this operation during deployment, startup, or immediately after route changes.

### Manual synchronization from Admin

An administrator with `menus.manage` permission can open a menu and select **Manual route update**. The browser reads the selected local JSON file and sends its JSON body to:

```http
PUT /api/v1/admin/menus/routes/sync
Authorization: Bearer <admin-jwt>
X-Application-Id: <application-id>
```

The backend does not download a manifest URL. Therefore the synchronization flow does not introduce an SSRF fetch surface.

After synchronization, the menu candidate table is refreshed. Registered routes are not automatically inserted into a menu.

### Synchronization rules

- New routes are added to the route registry.
- Existing route titles, paths and metadata are updated.
- Routes missing from the same source are marked `UNAVAILABLE` when `replaceMissing` is enabled.
- Manual menu items are never deleted or overwritten.
- Menu hierarchy, ordering, visibility and activation are never changed by route synchronization.
- Published CMS pages and content are discovered directly by Content Platform and do not belong in the tenant manifest.
- `TENANT_ROUTE`, CMS content, custom URLs and groups can be combined by an administrator in the same menu.
- Delivery excludes unavailable tenant routes and unpublished CMS content.

### Menu delivery

The consumer receives the final active menu through:

```http
GET /api/v1/content/menus/{languageCode}/{code}
X-Application-Id: <application-id>
X-Application-Token: <delivery-token>
```

Management tokens and admin JWTs must never be exposed to browser visitors.
