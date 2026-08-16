# Deploying STL Shelf on Coolify

STL Shelf ships with a production `Dockerfile` and a self-contained
`docker-compose.coolify.yml` that runs the app together with its two
dependencies — **PostgreSQL** and **MinIO** (S3-compatible object storage) —
as a single Coolify resource.

At runtime `bun start` applies database migrations **before** the server binds,
so a bad migration aborts the deploy instead of serving broken code.

## Prerequisites

- A running [Coolify](https://coolify.io) instance (v4+).
- This repository connected to Coolify as a Git source (GitHub App, deploy key,
  or public URL).
- DNS you control, or Coolify's wildcard domain, for the two public URLs this
  stack needs (the app and the MinIO S3 API).

## 1. Create the resource

1. In your Coolify project: **+ New → Resource → Docker Compose**
   (also called the "Docker Compose" build pack).
2. Select this repository and the branch you want to deploy.
3. Set **Compose file** to `docker-compose.coolify.yml`.
4. Save. Coolify parses the compose file and shows the `app`, `postgres`,
   `minio`, and `minio-setup` services.

Coolify builds the `app` image from the `Dockerfile` automatically — you do not
need a separate build step.

## 2. Domains

The compose file declares two public endpoints via Coolify magic variables:

| Variable                  | Service | Purpose                                                                              |
| ------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `SERVICE_FQDN_APP_3000`   | `app`   | The STL Shelf web app (port 3000)                                                    |
| `SERVICE_FQDN_MINIO_9000` | `minio` | The MinIO S3 API (port 9000), used by the browser via presigned upload/download URLs |

Coolify auto-generates both domains on first deploy. To use your own, open the
resource's **Domains** section and set them there (for example
`https://shelf.example.com` for the app and `https://files.example.com` for
MinIO). **Both must be publicly reachable** — the browser talks to MinIO
directly through presigned URLs, so an internal-only address will break uploads
and downloads.

`AUTH_URL`, `WEB_URL`, and `STORAGE_ENDPOINT` are derived from these domains
automatically; you do not set them by hand.

## 3. Secrets (auto-generated)

These are generated once by Coolify and stay stable across redeploys — nothing
to fill in:

- `SERVICE_USER_POSTGRES` / `SERVICE_PASSWORD_POSTGRES` — database credentials.
- `SERVICE_USER_MINIO` / `SERVICE_PASSWORD_MINIO` — MinIO root user, reused as
  the app's S3 access key / secret key.
- `SERVICE_BASE64_64_BETTERAUTH` — the 64-char `BETTER_AUTH_SECRET`.

## 4. Optional integrations

The app boots with placeholder values for the third-party services, so you can
deploy first and wire these up later. Set real values under the resource's
**Environment Variables** to enable each feature:

| Variable                                          | Enables                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `TURNSTILE_SECRET_KEY` / `TURNSTILE_SITE_KEY`     | Cloudflare Turnstile captcha on auth forms (defaults to Cloudflare's "always passes" test keys) |
| `RESEND_API_KEY` / `EMAIL_FROM`                   | Transactional email (verification, password reset, invites) via [Resend](https://resend.com)    |
| `OPENPANEL_CLIENT_ID` / `OPENPANEL_CLIENT_SECRET` | [OpenPanel](https://openpanel.dev) analytics                                                    |

Billing (Polar.sh) is off by default and optional for self-hosting — see
`.env.example` for the full list of `POLAR_*` variables if you want it.

Without a real `RESEND_API_KEY`, transactional email is inert. To sign up the
first account, either configure Resend or (if you have psql access to the
`postgres` service) flip the user's `emailVerified` flag directly.

## 5. Deploy

Click **Deploy**. On first boot:

1. `postgres` and `minio` start and pass their health checks.
2. `minio-setup` creates the private `stl-shelf-models` bucket.
3. `app` builds, runs migrations, then serves on its domain.

Watch the **Logs** tab. A successful start ends with:

```
[SUCCESS] Server listening on http://localhost:3000
```

Open the app's domain and you should see STL Shelf.

## Redeploys & migrations

Every deploy reruns `bun run db:migrate` before the new server binds. A failed
migration prints a loud banner and exits non-zero, so Coolify keeps the old
container running rather than serving a schema-mismatched build. Fix the
migration and redeploy — the runner is idempotent and only applies pending
entries from `drizzle/meta/_journal.json`.

## Backups

- **Postgres** — Coolify can schedule automated backups for the `postgres`
  service (S3 or local). Enable them under the service's **Backups** tab.
- **MinIO** — the `stl-shelf-minio` volume holds all uploaded models. Back it
  up with `mc mirror` to another bucket, or snapshot the volume.

## Troubleshooting

- **App restarts / exits during migration** — check `DATABASE_URL` resolves and
  Postgres is healthy; the loud migration banner in the logs names the failing
  statement.
- **Uploads or 3D previews fail in the browser** — the MinIO domain
  (`SERVICE_FQDN_MINIO_9000`) is not publicly reachable, or `STORAGE_USE_SSL`
  doesn't match how MinIO is exposed. Confirm you can reach the MinIO domain
  over HTTPS.
- **`bun start` boots but auth redirects are wrong** — make sure the app domain
  is set so `AUTH_URL` / `WEB_URL` match the URL you actually visit.

## Alternative: Dockerfile build pack

If you'd rather manage Postgres and object storage as separate Coolify
resources (or use managed Postgres / Cloudflare R2), use the **Dockerfile**
build pack against this repo instead and provide the environment variables from
[`.env.example`](../../.env.example) yourself. The bundled
`docker-compose.coolify.yml` is the batteries-included path.
