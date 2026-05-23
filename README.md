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
