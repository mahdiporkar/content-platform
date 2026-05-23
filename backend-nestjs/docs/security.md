# Security Hardening

## Planes

- Admin plane:
  - `/api/v1/admin/**`
  - `/api/v1/media/**`
  - Requires admin Bearer JWT only.
- Delivery plane:
  - `/api/v1/content/**`
  - `/api/public/media/**`
  - `/media/:appId/*`
  - Requires `X-Application-Id` and `X-Application-Token`.

Deprecated delivery headers are still accepted for compatibility. The backend logs a warning when legacy raw header names are used.

## Delivery Headers

- Official:
  - `X-Application-Id`
  - `X-Application-Token`
- Legacy aliases still read:
  - `x-app-id`
  - `x-application-id`
  - `x-application-token`

## Domain-Locked Policy

The `domain-locked` policy is an extra browser-domain check, not the primary authentication layer.

- If `Origin` or `Referer` exists:
  - the host must be in `allowedDomains`
  - otherwise the request is rejected with `403`
- If `Origin` and `Referer` are both missing:
  - the request is allowed to continue
  - this supports server-to-server delivery because the application token is mandatory

## Admin Authentication

- Production fails fast if `JWT_SECRET` is missing, weak, or a known placeholder.
- Login uses in-memory throttling and short lockouts. The structure is intentionally simple so Redis can replace it later.
- Admin JWT now carries `tokenVersion`.
- Every authenticated admin request re-checks the user record:
  - suspended users are rejected
  - changed `tokenVersion` invalidates old tokens

## Application Tokens

- Application tokens are now stored as `sha256(token + salt)` material (`apiTokenHash` + `apiTokenSalt`).
- Plaintext `apiToken` is deprecated and only kept for backward-compatible migration.
- New or rotated tokens are shown once in admin responses and are not readable from the database afterward.

## View Tracking

- View tracking requires a valid application token.
- Domain policy is enforced with the same option-2 rules as delivery content.
- In-memory rate limiting reduces abuse and analytics pollution.

## Visitor Media Proxy

- Consumer applications keep the application id and application token on the server side.
- Delivery responses expose browser-safe media proxy URLs such as `/media/:appId/*`.
- The browser should not receive direct MinIO URLs or the MinIO port.
- `MediaGatewayController` streams the object from MinIO and applies application status and domain policy checks.

## Future Paid Content

The codebase now includes:

- `consumer_users`
- `consumer_entitlements`
- `AccessControlService`
- `POST /api/v1/content/media/:mediaId/access`

The media access endpoint currently returns a direct media URL. It is the integration point for future user-level entitlement checks and signed URLs with expiry.

## HTML Safety

- Delivery now prefers sanitized HTML for posts and articles.
- The sanitizer is intentionally conservative and strips obvious script/event-handler payloads.
- UI consumers should still sanitize or render trusted markdown instead of blindly trusting raw HTML.
