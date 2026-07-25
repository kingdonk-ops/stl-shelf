---
name: stl-shelf-environment-setup
description: One-time local environment setup and maintenance for STL Shelf — MinIO CORS and bucket bootstrap, ngrok tunnel for local OAuth and Polar webhook testing, and Postgres/MinIO backup commands. Use when bootstrapping a fresh dev environment, testing OAuth or Polar webhooks locally, or taking a data backup.
---

# STL Shelf environment setup

## MinIO CORS + bucket policy (first-time setup)

- `docker exec stl-shelf-minio mc alias set local http://localhost:9000 stlshelf stlshelf_minio_dev_password`
- `docker exec stl-shelf-minio mc admin config set local api cors_allow_origin="http://localhost:3000"`
- `docker exec stl-shelf-minio mc anonymous set none local/stl-shelf-models`
- `docker compose restart minio`

The bucket must stay private (no anonymous reads) to match the production object storage: all reads go through presigned URLs or `/api/download/*`. Environments bootstrapped before July 2026 had a public-read policy — the `mc anonymous set none` step fixes them.

## Local OAuth testing (ngrok)

- `bun run ngrok`
- `.env`: `NGROK_DOMAIN=yourname.ngrok-free.app`, `NGROK_PORT=3000` (optional), `AUTH_URL=https://yourname.ngrok-free.app`, `WEB_URL=https://yourname.ngrok-free.app`
- Polar webhook: `https://yourname.ngrok-free.app/api/auth/polar/webhooks`

## Data backup

- Postgres: `docker exec stl-shelf-postgres pg_dump -U stlshelf stlshelf > backup.sql`
- MinIO: `docker run --rm -v stl-shelf_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz /data`
