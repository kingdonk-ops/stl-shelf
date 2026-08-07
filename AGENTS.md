# AGENTS.md

STL Shelf is a unified full-stack TypeScript app (TanStack Start) for managing a personal library of 3D printable models (STL, 3MF, OBJ).

Package manager: Bun (`bun@1.3.5`). Use `bun` commands, not npm/yarn.

Command gotchas (everything else is in `package.json` scripts):

- Build: `bun run build` — do not run if the dev server is already running; `bun build` invokes Bun's native bundler.
- Tests: `bun run test` — NOT `bun test`, which invokes Bun's own runner and breaks on `vi.hoisted`.

Quality gate:

- Always run `bun check` and `bun check-types` before replying in the final message.

Database:

- PSQL connection: `psql "postgresql://stlshelf:stlshelf_dev_password@localhost:5432/stlshelf"`
- Drizzle commands: `bun db:generate`, `bun db:migrate`, `bun db:push`, `bun db:studio`, `bun db:seed`
- Seed data: `bun db:seed` (runs `drizzle/seeds/*.sql`)
- Docker services: `docker compose up -d`, `docker compose down`, `docker compose logs -f`, `docker compose restart minio`
- Migration guidelines:
- Always change schema in `src/lib/db/schema` first, then run `bun db:generate` to produce SQL + update `drizzle/meta/_journal.json`.
- Never add or edit `drizzle/*.sql` by hand without a matching entry in `drizzle/meta/_journal.json` (migrations are driven by the journal).
- Confirm the newest migration exists in both `drizzle/*.sql` and `drizzle/meta/_journal.json` before deploy.
- Run `bun db:migrate` locally after generating.
- `bun db:migrate` runs `scripts/migrate.ts`, a custom runner (NOT `drizzle-kit migrate`, which wraps every migration in a transaction and fails on `CREATE INDEX CONCURRENTLY`). It uses the same `drizzle.__drizzle_migrations` table, so it stays interoperable with drizzle-kit.
- A migration containing `CONCURRENTLY` runs statement-by-statement OUTSIDE a transaction (no rollback). Every statement in such a migration must be idempotent (`IF NOT EXISTS` / `IF EXISTS`). If a concurrent index build fails it can leave an INVALID index — `DROP INDEX` it before rerunning.
- If a migration is ever applied out-of-band (psql), record it: `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (sha256-hex of the .sql file, journal "when" ms)`.
- Deploys: `bun start` runs migrations BEFORE the server binds — a failed migration aborts startup (loud banner, exit 1) so the old container keeps serving. In Coolify the start command must be `bun start`; never run migrations as a post-deployment hook (hook failures are silent and run after new code is already live — this hid unapplied migrations 0014/0015 in prod from Jan to Jul 2026).

MinIO bucket policy:

- The bucket must stay private (no anonymous reads) to match the production object storage: all reads go through presigned URLs or `/api/download/*`. Environments bootstrapped before July 2026 had a public-read policy — the `mc anonymous set none` step fixes them.

One-time environment setup (MinIO CORS + bucket bootstrap, ngrok OAuth tunnel, Postgres/MinIO backups): see [`.claude/skills/stl-shelf-environment-setup/SKILL.md`](.claude/skills/stl-shelf-environment-setup/SKILL.md).

Git:

- Always run git commands directly; never touch or create `.git/index.lock`.

If a command fails due to insufficient permissions, you must elevate the command to the user for approval.

UI/UX Redesigns:

- Preserve brand colors + fonts; don’t re-theme.
- Prefer task-based IA (Overview / Files / Versions / Print Profiles) to avoid deep scroll.
- Avoid redundant surfaces (no separate sheet if inline history exists).

More details:

- [Architecture](docs/agents/architecture.md)
- [Commands](docs/agents/commands.md)
- [Tech stack](docs/agents/tech-stack.md)
- [Engineering principles](docs/agents/principles.md)
- [Server patterns](docs/agents/server-patterns.md)
- [Frontend architecture](docs/agents/frontend.md)
- [Code quality standards](docs/agents/code-quality.md)
