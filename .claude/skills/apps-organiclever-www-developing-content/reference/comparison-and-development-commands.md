# organiclever-www — Comparison with Other Apps and Development Commands

## Comparison with Other Apps

| Aspect              | organiclever-www                   | ayokoding-web                  | ose-web                 |
| ------------------- | ---------------------------------- | ------------------------------ | ----------------------- |
| **Framework**       | Next.js 16 (App Router)            | Next.js 16 (App Router)        | Next.js 16 (App Router) |
| **Architecture**    | Feature contexts                   | Feature folders                | Feature folders         |
| **Storage**         | PGlite (local-first, IndexedDB)    | tRPC + database                | tRPC + database         |
| **Auth**            | None (local-first)                 | None                           | None                    |
| **State**           | XState + Effect TS                 | React state                    | React state             |
| **Build**           | Next.js (Vercel)                   | Next.js (Vercel)               | Next.js (Vercel)        |
| **Prod Branch**     | prod-organiclever-www              | prod-ayokoding-www             | prod-ose-www            |
| **Languages**       | English                            | Bilingual (Indonesian/English) | English only            |
| **Complexity**      | Full life journal + local storage  | Fullstack bilingual platform   | Simple landing page     |
| **Prod URL**        | www.organiclever.com               | ayokoding.com                  | oseplatform.com         |
| **Primary Purpose** | Local-first life journal + landing | Educational platform           | Project landing page    |

## Development Commands

### Option 1: Nx (host, recommended for frontend-only work)

```bash
# Start development server (http://localhost:3200)
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev organiclever-www

# Build for production (local verification)
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- build organiclever-www

# Type checking
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec tsc -- \
  --noEmit --project apps/organiclever-www/tsconfig.json
```

### Option 2: Docker Compose (containerized, or running alongside the backend)

Runs the app inside a Node.js 24 Alpine container. Useful when you need the backend alongside the
frontend, or want an environment closer to CI.

```bash
# From repository root — starts organiclever-www in Docker
rtk ./hippo run --class service --resource-tier standard --disk-path . -- \
  docker compose -f infra/dev/organiclever-www/docker-compose.yml up --build

# Or start the frontend container only
rtk ./hippo run --class service --resource-tier standard --disk-path . -- \
  docker compose -f infra/dev/organiclever-www/docker-compose.yml up organiclever-www
```

**First startup** (~2-4 min): installs npm dependencies inside the container.
**Subsequent starts**: fast — `node_modules` is persisted in a named Docker volume.

> `node_modules` is intentionally isolated from the host via a Docker named volume to prevent
> Alpine Linux binary conflicts with macOS/Windows/Linux host binaries.
