# Demo Consumer App

This app represents a public consumer website. It must not ask visitors for platform credentials and must not put tokens in browser URLs.

## Server-Side Configuration

Set these variables on the server that runs this Next.js app:

```bash
CONTENT_PLATFORM_API_BASE_URL=http://localhost:3001
CONTENT_PLATFORM_APPLICATION_ID=<application-id>
CONTENT_PLATFORM_API_TOKEN=<application-token>
```

For local development, put them in `frontend/demo-next/.env.local`.

For Docker Compose, set `CONTENT_PLATFORM_APPLICATION_ID` and `CONTENT_PLATFORM_API_TOKEN` in the root `.env` file before running `docker compose up --build`.

The browser visitor only sees public routes such as `/posts`, `/articles`, `/gallery`, `/photos`, and `/videos`. Media URLs returned to the browser should point to the content platform proxy, not to MinIO directly.
