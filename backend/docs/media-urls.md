# Media URL Contract

MinIO is an internal storage dependency. API responses must not expose the MinIO host or port.

Base URL priority for public media links:

1. `application.websiteUrl`
2. `CONTENT_PLATFORM_BASE_URL`

Relevant environment variables:

- `CONTENT_PLATFORM_BASE_URL` default: `http://localhost:3000`
- `MINIO_PUBLIC_BASE_URL` default: `http://localhost:9000`

Behavior:

- Services normalize stored media URLs to the gateway path form: `/media/{applicationId}/...`
- Web responses expand those paths to a full public URL using the application base URL when available
- HTML content is rewritten so `<img src="...">` and similar media links point to the platform gateway instead of MinIO
- Public media is served through `GET /media/{applicationId}/...`

Notes:

- `application.websiteUrl` currently acts as the per-application public media base override in the Java backend
- `MINIO_PUBLIC_BASE_URL` is only used to detect and rewrite legacy MinIO URLs; responses must never return it
