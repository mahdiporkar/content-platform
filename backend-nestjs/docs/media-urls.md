# Media URLs

MinIO is an internal storage endpoint and must not leak into public API responses.

## Public URL Priority

Media URLs returned by the API are built with this priority:

1. `application.publicBaseUrlOverride`
2. `CONTENT_PLATFORM_BASE_URL`
3. default local value: `http://localhost:3000`

The resulting public media URL always points to the Content Platform gateway path:

- `/media/...`

## Environment Variables

- `CONTENT_PLATFORM_BASE_URL`
  - public base URL for the Content Platform
  - default: `http://localhost:3000`
- `MINIO_PUBLIC_BASE_URL`
  - only used to detect and rewrite storage URLs on read
  - default: `http://localhost:9000`

## Rewrite Rules

The backend rewrites:

- `mediaUrl`
- `posterUrl`
- stored banner URLs
- gallery URLs
- media links inside delivery HTML such as `<img src="...">` and `<a href="...">`

Any absolute URL whose path is under `/media/...` is rewritten onto the public base URL. Non-media external links are left unchanged.
