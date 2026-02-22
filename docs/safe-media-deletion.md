# Safe Media Deletion Workflow

This project now uses a **trash-first media deletion policy** in both backends:

- `DELETE /media/:id` => soft delete only (`state=TRASH`)
- `POST /media/:id/restore` => restore to `ACTIVE`
- Physical deletion (`purge`) is **never automatic**
- Physical deletion is allowed only for **super admin** and only when reference count is `0`

## Core Rules

1. No retention auto-purge job.
2. User delete action does not remove objects from storage.
3. Purge is blocked when references exist.
4. Purge performs transaction lock + reference re-check.
5. Audit logs are recorded for trash/restore/purge attempt/success/block/failure.

## NestJS

### Tables / entities

- `media_assets` (state, trashed_at, purged_at, pinned, metadata, bucket, owner_user_id)
- `media_variants`
- `media_references`
- `audit_logs` (existing table used for actions)

Migration SQL for controlled environments:

- `backend-nestjs/db/migration/20260221_safe_media_deletion.sql`

### Main endpoints

- `GET /api/v1/media?applicationId=...&state=ACTIVE|TRASH`
- `DELETE /api/v1/media/:id?applicationId=...`
- `POST /api/v1/media/:id/restore?applicationId=...`
- `GET /api/v1/admin/media?applicationId=...&state=TRASH`
- `GET /api/v1/admin/media/:id/references?applicationId=...`
- `DELETE /api/v1/admin/media/:id/purge?applicationId=...`

### Notes

- Purge uses pessimistic row lock and reference re-check before storage delete.
- Storage deletion is abstracted behind `StorageProvider` and implemented by `MinioStorageProvider`.

## Java Backend

### Flyway migrations

- `V5__add_media_assets.sql` (existing)
- `V6__safe_media_deletion_workflow.sql` (state/refs/variants/audit additions)

### Main endpoints

- `GET /api/v1/media?applicationId=...&state=ACTIVE|TRASH`
- `DELETE /api/v1/media/:id?applicationId=...`
- `POST /api/v1/media/:id/restore?applicationId=...`
- `GET /api/v1/admin/media?applicationId=...&state=TRASH`
- `GET /api/v1/admin/media/:id/references?applicationId=...`
- `DELETE /api/v1/admin/media/:id/purge?applicationId=...`
- `GET /api/v1/admin/media/library?...` (asset library listing)

### Notes

- Purge path is transaction-wrapped and uses DB lock (`findByIdForUpdate`) + reference re-check.
- Purge returns conflict semantics when media is referenced.
- Storage abstraction is on `MediaStoragePort` (`deleteObject`, `deleteMany`) with MinIO implementation.

## Tests

- NestJS unit tests:
  - `backend-nestjs/test/media-lifecycle.service.spec.ts`
- Java unit tests:
  - `backend/src/test/java/com/contentplatform/backend/application/service/MediaLibraryServiceTest.java`
