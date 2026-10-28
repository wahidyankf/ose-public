# OSE Application — Deployment Topology

## Environments

| Environment | Frontend             | Backend          | Database                                |
| ----------- | -------------------- | ---------------- | --------------------------------------- |
| Development | `nx dev ose-app-web` | `nx dev ose-be`  | Podman Compose (`podman-compose` 1.6.0) |
| Staging     | Vercel (TBD)         | Kubernetes (TBD) | Managed Postgres                        |
| Production  | Vercel (TBD)         | Kubernetes (TBD) | Managed Postgres                        |

## Dev stack

```bash
# Start full dev stack (postgres + be + web)
export PODMAN_COMPOSE_PROVIDER=podman-compose
podman compose -f infra/dev/ose-app/docker-compose.yml up --build -d

# Or start individually
nx dev ose-be   # http://localhost:8302
nx dev ose-app-web  # http://localhost:3300
```

## Container images

| Image               | Base                                       | Purpose               |
| ------------------- | ------------------------------------------ | --------------------- |
| `ose-be` (dev)      | `mcr.microsoft.com/dotnet/sdk:10.0-alpine` | Hot-reload dev server |
| `ose-app-web` (dev) | `node:24-alpine`                           | Hot-reload dev server |

## Notes

- Vercel project linking deferred to first staging deploy plan
- Kubernetes manifests deferred to ops plan
- Production Postgres provisioning deferred to ops plan
