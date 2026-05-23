# Swagger Content Delivery Scenario

This guide shows how to receive published delivery content through Swagger in a local development environment.

## Prerequisites

Run the local services first:

- Backend API: `http://localhost:3001`
- Swagger UI: `http://localhost:3001/api/docs`
- PostgreSQL: `localhost:5432`
- MinIO API: `localhost:9000`

The seed admin account is:

```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

## 1. Login as Admin

Open Swagger:

```text
http://localhost:3001/api/docs
```

Call:

```text
POST /api/v1/auth/login
```

Request body:

```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

Copy the returned admin JWT token.

## 2. Authorize Admin Requests

Click `Authorize` in Swagger and set the Bearer token.

Use this format if Swagger asks for the full authorization value:

```text
Bearer <admin-jwt-token>
```

If Swagger asks only for the token value, enter:

```text
<admin-jwt-token>
```

## 3. Get the Application Id

Call:

```text
GET /api/v1/admin/applications
```

Copy the `id` of the application you want to use. This value is the `applicationId` used by delivery endpoints.

## 4. Create or Rotate the Application Token

Application tokens are shown only when they are created or rotated. If you do not already have the raw application token, rotate it:

```text
POST /api/v1/admin/applications/{id}/token/rotate
```

Copy the `apiToken` from the response. Store it for local testing because it will not be shown again.

## 5. Receive Content

Use the delivery endpoints under:

```text
/api/v1/content
```

Required headers:

```text
X-Application-Id: <applicationId>
X-Application-Token: <apiToken>
```

Delivery routes read the application id from `X-Application-Id`, not from the URL.

Example request:

```text
GET /api/v1/content?page=0&size=10
```

Common query parameters:

- `page`: zero-based page number, default `0`
- `size`: page size, default `10`
- `type`: content type, for example `POST`, `ARTICLE`, or `VIDEO`
- `locale`: optional locale filter
- `collection`: optional collection slug
- `tags`: optional tag filter

## Useful Delivery Endpoints

```text
GET /api/v1/content
GET /api/v1/content/posts
GET /api/v1/content/articles
GET /api/v1/content/videos
GET /api/v1/content/posts/{slug}
GET /api/v1/content/articles/{slug}
GET /api/v1/content/videos/{id}
GET /api/v1/content/gallery
GET /api/v1/content/gallery/{index}
GET /api/v1/content/collections/{slug}
POST /api/v1/content/events/view
POST /api/v1/content/media/{mediaId}/access
```

## Visitor-Side Media URLs

The consumer website should keep `X-Application-Id` and `X-Application-Token` on the server side. The browser visitor should only receive rendered content and media URLs.

Delivery responses return media URLs through the content platform media proxy:

```text
http://localhost:3001/media/{applicationId}/...
```

The browser uses that proxy URL. It should not receive direct MinIO URLs such as:

```text
http://localhost:9000/...
```

The content platform proxy streams the object from MinIO internally.

## Troubleshooting

- `401 Missing application token.` means `X-Application-Token` was not sent.
- `401 Invalid application credentials.` means the application id or token is wrong.
- `403 Domain policy enforced...` means the application is domain-locked and the request `Origin` or `Referer` is not allowed.
- Empty result pages usually mean there is no published content for that application yet.
