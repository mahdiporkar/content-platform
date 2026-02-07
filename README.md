# content-platform

Multi-tenant content platform built with NestJS, PostgreSQL, and MinIO, with an Admin panel (React) and demo consumer app (Next.js).

![Architecture Diagram](./docs/architecture.png)

## Architecture Docs

- ERD, API Map, and Service Dependency Graph: [`docs/architecture/README.md`](docs/architecture/README.md)

## Runtime Services

- Backend API: `http://localhost:3001`
- Admin UI: `http://localhost:3002`
- Demo UI: `http://localhost:3003`
- PostgreSQL: `localhost:5432`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

## Quick Start

```bash
npm run dev:all
```

Or with Docker:

```bash
docker compose up --build
```
