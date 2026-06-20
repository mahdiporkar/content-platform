# content-platform

Multi-tenant content platform built with NestJS, PostgreSQL, and MinIO, with an Admin panel (React) and demo consumer app (Next.js).

[فارسی](README.fa.md)

![Architecture Diagram](./docs/architecture.png)

## Architecture Docs

- ERD, API Map, and Service Dependency Graph: [`docs/architecture/README.md`](docs/architecture/README.md)
- Swagger content delivery scenario: [`docs/swagger-content-delivery.md`](docs/swagger-content-delivery.md)

## Runtime Services

- Backend API: `http://localhost:3001`
- Admin UI: `http://localhost:3002`
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
- Tenant-scoped Admin APIs receive the selected application through `X-Application-Id`; create/update payloads may also contain ownership fields where required. The backend checks the selected application against the authenticated user's access.
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
POST /api/v1/admin/menus/from-routes
PUT /api/v1/admin/menus/{id}
PATCH /api/v1/admin/menus/{id}/status
DELETE /api/v1/admin/menus/{id}
GET /api/v1/admin/menus/{id}
GET /api/v1/admin/menus
GET /api/v1/admin/menus/routes
PUT /api/v1/admin/menus/routes/sync
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
## Complete Menu Management Guide

Content Platform separates **application routes** from **final menus**. This distinction keeps the platform multi-tenant and prevents tenant deployments from overwriting editorial navigation decisions.

### Core concepts

- **Application / tenant**: the owner of routes, menus, pages, and content. It is identified by `applicationId`.
- **Tenant route**: a route implemented in consumer application code, such as `/{locale}/about`.
- **Route manifest**: the contract through which a tenant announces its code-defined routes.
- **Menu**: a language-specific navigation container stored in Content Platform.
- **Menu item**: an ordered entry inside a menu. Items may be nested using `parentId`.
- **Delivery menu**: the final active and filtered menu returned to a consumer application.

Routes and menus are different records. Synchronizing a manifest updates the route registry; it does not silently rewrite an existing menu.

### Menu fields

| Field | Meaning |
| --- | --- |
| `applicationId` | Tenant that owns the menu. Admin requests normally provide it through `X-Application-Id`. |
| `code` | Stable technical identifier used by the consumer, for example `main-menu`. |
| `title` | Human-readable admin label, for example `Main menu`. |
| `languageCode` | Menu language: `fa`, `en`, `ar`, `zh`, or `ru`. |
| `location` | Intended placement: `HEADER`, `FOOTER`, `SIDEBAR`, or `MOBILE`. |
| `status` | `ACTIVE` menus are deliverable; `INACTIVE` menus are retained but not returned publicly. |

The combination `applicationId + code + languageCode` must be unique. Treat `code` as an API contract: changing it requires updating the consumer request.

Examples:

```text
main-menu
footer-menu
mobile-menu
```

```http
GET /api/v1/content/menus/fa/main-menu
```

### Menu item types and ownership

| Type | Purpose | Managed by |
| --- | --- | --- |
| `TENANT_ROUTE` | Route implemented by tenant code | `TENANT` |
| `PAGE` | Dynamic CMS page | `CMS` |
| `ARTICLE` | Published article | `CMS` |
| `POST` | Published post | `CMS` |
| `GALLERY` | Published gallery | `CMS` |
| `CUSTOM_URL` | Internal manually entered URL | `ADMIN` |
| `EXTERNAL_URL` | External link | `ADMIN` |
| `GROUP` | Structural parent without a destination | `ADMIN` |

Important item fields:

- `referenceId`: referenced route or CMS entity id.
- `url`: resolved destination.
- `target`: `SELF` or `BLANK`.
- `sortOrder`: sibling ordering.
- `parentId`: optional parent for nested menus.
- `isVisible`: admin-controlled visibility.
- `source` and `sourceKey`: tenant route source and stable route key.
- `managedBy`: `TENANT`, `CMS`, or `ADMIN`.
- `dynamic`: indicates that the item is backed by registered or CMS-managed data.

### Route manifest

The manifest describes routes that exist in tenant code. It is not the final menu and does not define menu location, hierarchy, visibility, or activation.

```json
{
  "source": "tenant-web",
  "replaceMissing": true,
  "routes": [
    {
      "key": "home",
      "path": "/{locale}",
      "titles": {
        "fa": "خانه",
        "en": "Home"
      },
      "icon": "home",
      "cssClass": "nav-home",
      "metadata": {
        "section": "primary"
      }
    },
    {
      "key": "about",
      "path": "/{locale}/about",
      "titles": {
        "fa": "درباره ما",
        "en": "About"
      }
    }
  ]
}
```

Manifest rules:

- `source` identifies the producer, such as `magical-bank-web`.
- `key` is stable within that source.
- `path` may use `{locale}` or `{languageCode}` placeholders.
- `titles` contains localized labels.
- `icon`, `cssClass`, and `metadata` are optional.
- `applicationId + source + key` is unique.
- Repeating the same sync is idempotent and does not create duplicates.
- With `replaceMissing: true`, omitted routes from the same source become `UNAVAILABLE`.
- An unavailable route remains in history but is excluded from public menu delivery.

### Automatic synchronization by a tenant

Create or rotate a management token:

```http
POST /api/v1/admin/applications/{id}/management-token/rotate
```

Store the returned token only in the tenant backend, deployment environment, or CI secret. Then submit the manifest:

```http
PUT /api/v1/management/navigation/routes
Authorization: Bearer <management-token>
X-Application-Id: <application-id>
Content-Type: application/json
```

Recommended synchronization times:

- application deployment
- backend startup using an idempotent operation
- immediately after adding, removing, or renaming code-defined routes
- a dedicated CI command such as `npm run sync-navigation`

Never expose the management token through `NEXT_PUBLIC_*`, `VITE_*`, browser JavaScript, or committed manifest files.

### Consumer environment variables for menu integration

The Magical Bank API is an example consumer backend that both synchronizes its code-defined routes and retrieves the final menu. Its Docker Compose configuration uses:

```yaml
environment:
  CONTENT_PLATFORM_API_BASE_URL: ${CONTENT_PLATFORM_API_BASE_URL:-http://content-platform-backend:3001}
  CONTENT_PLATFORM_APPLICATION_ID: ${CONTENT_PLATFORM_APPLICATION_ID:-}
  CONTENT_PLATFORM_API_TOKEN: ${CONTENT_PLATFORM_API_TOKEN:-}
  CONTENT_PLATFORM_MANAGEMENT_TOKEN: ${CONTENT_PLATFORM_MANAGEMENT_TOKEN:-}
  CONTENT_PLATFORM_MENU_CODE: ${CONTENT_PLATFORM_MENU_CODE:-main-menu}
  SYNC_MENU_ON_START: ${SYNC_MENU_ON_START:-true}
  MENU_MANIFEST_PATH: ${MENU_MANIFEST_PATH:-manifestmenu.json}
```

These variables belong to two separate flows:

| Flow | Variables | Purpose |
| --- | --- | --- |
| Route synchronization | `CONTENT_PLATFORM_API_BASE_URL`, `CONTENT_PLATFORM_APPLICATION_ID`, `CONTENT_PLATFORM_MANAGEMENT_TOKEN`, `SYNC_MENU_ON_START`, `MENU_MANIFEST_PATH` | Sends code-defined routes to the route registry. |
| Final menu delivery | `CONTENT_PLATFORM_API_BASE_URL`, `CONTENT_PLATFORM_APPLICATION_ID`, `CONTENT_PLATFORM_API_TOKEN`, `CONTENT_PLATFORM_MENU_CODE` | Retrieves the active menu selected and arranged by an administrator. |

They do not all send a final menu structure. The manifest synchronization registers application routes; `CONTENT_PLATFORM_MENU_CODE` is only used later when reading the final menu.

#### `CONTENT_PLATFORM_API_BASE_URL`

Base URL used for both management and delivery requests.

```bash
CONTENT_PLATFORM_API_BASE_URL=http://content-platform-backend:3001
```

- Inside the same Docker network, use the Content Platform service name and internal port.
- From a production server outside that network, use the externally reachable HTTPS URL.
- Do not use `localhost` unless Content Platform runs inside the same container or process namespace.
- Do not append `/api/v1`; the consumer implementation appends endpoint paths.

#### `CONTENT_PLATFORM_APPLICATION_ID`

Identifies the tenant whose routes are synchronized and whose final menu is fetched.

```bash
CONTENT_PLATFORM_APPLICATION_ID=7d58a2bb-caa3-400f-a433-d59d8556ad01
```

It is sent as `X-Application-Id` in both management and delivery requests. The management token and delivery token must belong to this same application. A mismatched application id and token causes authentication or authorization failure.

#### `CONTENT_PLATFORM_MANAGEMENT_TOKEN`

Server-side secret used only to modify the tenant route registry:

```http
PUT /api/v1/management/navigation/routes
Authorization: Bearer <management-token>
X-Application-Id: <application-id>
```

Generate or rotate it through:

```http
POST /api/v1/admin/applications/{id}/management-token/rotate
```

Important behavior:

- It does not fetch content or menus.
- It is not the application delivery token.
- It must only exist in a backend, CI secret, Docker/CapRover environment, or secret manager.
- If it or `CONTENT_PLATFORM_APPLICATION_ID` is empty, startup synchronization is skipped and a warning is logged.
- Rotating it invalidates the previous management token, so the consumer environment must be updated.

#### `CONTENT_PLATFORM_API_TOKEN`

Server-side delivery secret used to read published content and the final active menu:

```http
GET /api/v1/content/menus/{languageCode}/{code}
X-Application-Id: <application-id>
X-Application-Token: <delivery-token>
```

It cannot synchronize routes. Keep it separate from `CONTENT_PLATFORM_MANAGEMENT_TOKEN` and never expose either token to visitor browsers.

#### `CONTENT_PLATFORM_MENU_CODE`

Stable code of the final menu fetched from Content Platform.

```bash
CONTENT_PLATFORM_MENU_CODE=main-menu
```

In the Magical Bank API, a request such as:

```http
GET /content/menus/fa
```

is proxied by the consumer backend to:

```http
GET /api/v1/content/menus/fa/main-menu
```

This variable:

- does not control manifest synchronization
- does not create a menu
- must match the `code` of an existing `ACTIVE` menu for the requested language
- may point different deployments to different menu contracts, such as `main-menu`, `mobile-menu`, or `footer-menu`

Changing the code is a runtime configuration change, but the referenced menu must already exist in Content Platform.

#### `SYNC_MENU_ON_START`

Controls whether the consumer backend sends its route manifest during application startup.

```bash
SYNC_MENU_ON_START=true
```

Current Magical Bank implementation behavior:

- the exact string `false` disables startup synchronization
- `true`, an empty/unset value, or any other value does not disable it
- synchronization runs from NestJS `onModuleInit`
- missing application id or management token skips synchronization with a warning
- an unreadable file, invalid JSON, authentication failure, network error, or rejected sync can fail module initialization and prevent a successful startup

Production recommendations:

- use `true` when every instance is allowed to perform the same idempotent sync
- use `false` when synchronization is handled by CI, a release job, or a single designated instance
- avoid unnecessary concurrent startup syncs when many replicas start together

The name is historical: it synchronizes the **route manifest**, not the final menu layout.

#### `MENU_MANIFEST_PATH`

Filesystem path read by the consumer backend when route synchronization runs.

```bash
MENU_MANIFEST_PATH=manifestmenu.json
```

- A relative path is resolved from the process working directory.
- In the Magical Bank production image, the Dockerfile copies `manifestmenu.json` to `/app/manifestmenu.json`, and the process working directory is `/app`.
- An absolute path may be used when the manifest is mounted as a Docker volume or secret/config file.
- Changing this variable only changes which file is read; it does not change the menu code or delivery endpoint.
- If the file is baked into the Docker image, changing its contents requires rebuilding and redeploying the image.
- If the file is mounted at runtime, its contents can be updated without rebuilding, but the service must synchronize again.

Example with an absolute mounted path:

```yaml
environment:
  MENU_MANIFEST_PATH: /app/config/manifestmenu.json
volumes:
  - ./manifestmenu.json:/app/config/manifestmenu.json:ro
```

#### Startup execution sequence

The Magical Bank consumer implementation performs this sequence:

```text
Consumer API starts
      |
      v
Is SYNC_MENU_ON_START exactly "false"?
      | yes
      +----> Skip route synchronization
      |
      no
      v
Are application id and management token configured?
      | no
      +----> Log warning and continue startup
      |
      yes
      v
Read MENU_MANIFEST_PATH and parse JSON
      |
      v
PUT manifest to Content Platform management API
      |
      v
Content Platform inserts/updates routes and marks missing routes unavailable
```

Fetching the final menu happens independently when the consumer handles a menu request:

```text
Consumer receives languageCode
      |
      v
Uses CONTENT_PLATFORM_MENU_CODE
      |
      v
GET active menu with application id + delivery token
      |
      v
Returns final administrator-managed hierarchy to the web application
```

#### Docker Compose and CapRover example

```bash
CONTENT_PLATFORM_API_BASE_URL=https://content-api.example.com
CONTENT_PLATFORM_APPLICATION_ID=<application-id>
CONTENT_PLATFORM_API_TOKEN=<delivery-token>
CONTENT_PLATFORM_MANAGEMENT_TOKEN=<management-token>
CONTENT_PLATFORM_MENU_CODE=main-menu
SYNC_MENU_ON_START=true
MENU_MANIFEST_PATH=manifestmenu.json
```

Environment value changes do not alter a previously built manifest file. After changing runtime environment variables in CapRover, restart or redeploy the consumer app. Rebuild the image only when application code or a manifest copied into the image has changed.

### Manual synchronization in Admin

1. Select the target application in the admin sidebar.
2. Open **Menus**.
3. Click **Manual route update**.
4. Select a local JSON manifest.
5. Review synchronized and unavailable counts.
6. Review the registered routes table.

The browser parses the selected file and submits its JSON body to:

```http
PUT /api/v1/admin/menus/routes/sync
Authorization: Bearer <admin-jwt>
X-Application-Id: <application-id>
```

The backend never downloads a user-provided URL, so this workflow does not create an SSRF fetch surface.

### Creating a menu from registered routes

The **Create menu from routes** button provides a controlled shortcut:

1. Select an application that has available routes.
2. Open **Menus** and click **Create menu from routes**.
3. Enter a stable `code`, a display `title`, language, location, and status.
4. Confirm creation.

The operation calls:

```http
POST /api/v1/admin/menus/from-routes
Authorization: Bearer <admin-jwt>
X-Application-Id: <application-id>
Content-Type: application/json

{
  "code": "main-menu",
  "title": "Main menu",
  "languageCode": "en",
  "location": "HEADER",
  "status": "ACTIVE"
}
```

Behavior:

- A new menu is created.
- Every `AVAILABLE` tenant route becomes a top-level `TENANT_ROUTE` item.
- Titles and paths are resolved for the selected language.
- Route icons and CSS classes are copied.
- Items are ordered consistently by route source and key.
- Existing menus and manual items are never overwritten.
- An existing menu with the same application, code, and language causes a conflict response.
- No menu is created when the application has no available routes.

This button creates a useful initial menu. Administrators may then reorder, nest, hide, rename, add, or remove menu items.

### Editing and maintaining a menu

In the menu editor an administrator can:

- add registered tenant routes
- add published pages, articles, posts, and galleries
- add custom or external URLs
- create structural groups
- change item titles, icons, CSS classes, targets, and visibility
- arrange parent-child hierarchy and ordering
- remove an item without deleting the underlying route or CMS content
- activate or deactivate the menu
- delete the complete menu and all its menu items

Deleting a menu item does not delete its referenced route or content. Deleting a menu deletes only that menu structure. A later manifest sync also does not restore an item that an administrator intentionally removed from a menu.

`POST /api/v1/admin/menus/{id}/sync-published` adds missing available route and published CMS candidates to an existing menu. It does not delete existing manual items.

### Admin menu API

All endpoints require an admin JWT, `menus.manage`, and access to the selected application.

```http
GET    /api/v1/admin/menus
POST   /api/v1/admin/menus
POST   /api/v1/admin/menus/from-routes
GET    /api/v1/admin/menus/routes
PUT    /api/v1/admin/menus/routes/sync
GET    /api/v1/admin/menus/{id}
PUT    /api/v1/admin/menus/{id}
PATCH  /api/v1/admin/menus/{id}/status
DELETE /api/v1/admin/menus/{id}

POST   /api/v1/admin/menus/{id}/items
PUT    /api/v1/admin/menus/{id}/items/{itemId}
DELETE /api/v1/admin/menus/{id}/items/{itemId}
PUT    /api/v1/admin/menus/{id}/items/layout

GET    /api/v1/admin/menus/{id}/published-content
POST   /api/v1/admin/menus/{id}/sync-published
```

### Menu delivery

Fetch one active menu by its stable code:

```http
GET /api/v1/content/menus/{languageCode}/{code}
X-Application-Id: <application-id>
X-Application-Token: <delivery-token>
```

Fetch all active menus assigned to a location:

```http
GET /api/v1/content/menus/location/{languageCode}/{location}
X-Application-Id: <application-id>
X-Application-Token: <delivery-token>
```

Example server-side request:

```ts
const response = await fetch(
  `${process.env.CONTENT_PLATFORM_API_BASE_URL}/api/v1/content/menus/fa/main-menu`,
  {
    headers: {
      "X-Application-Id": process.env.CONTENT_PLATFORM_APPLICATION_ID!,
      "X-Application-Token": process.env.CONTENT_PLATFORM_API_TOKEN!
    },
    cache: "no-store"
  }
);

if (!response.ok) {
  throw new Error(`Menu delivery failed: ${response.status}`);
}

const menu = await response.json();
```

Delivery behavior:

- only `ACTIVE` menus are returned
- hidden items are excluded
- unavailable tenant routes are excluded
- unpublished CMS content is excluded
- tenant route placeholders are resolved for the requested language
- hierarchy is returned through each item's `children`

The delivery token belongs on the consumer server. Management tokens and admin JWTs must never be exposed to visitors.

### Recommended end-to-end workflow

```text
Tenant route changes
        |
        v
Manifest sync during deploy/startup
        |
        v
Registered route inventory in Content Platform
        |
        v
Create initial menu from routes or edit an existing menu
        |
        v
Administrator arranges routes, CMS content, groups, and custom links
        |
        v
Consumer backend fetches the active menu by language and code
        |
        v
Consumer frontend renders the returned hierarchy
```
