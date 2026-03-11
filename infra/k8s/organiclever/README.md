# OrganicLever Kubernetes Deployments

Kubernetes configurations for staging and production environments.

## Environments

### Staging (`staging/`)

- **Profile**: `SPRING_PROFILES_ACTIVE=staging`
- **Purpose**: Pre-production testing

### Production (`production/`)

- **Profile**: `SPRING_PROFILES_ACTIVE=prod`
- **Purpose**: Production deployment

## Docker Images

Production container images are built from Dockerfiles co-located with each app:

| Service          | Dockerfile                         | Build Command                                                                   |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| organiclever-be  | `apps/organiclever-be/Dockerfile`  | `docker build -t organiclever-be:latest apps/organiclever-be/`                  |
| organiclever-web | `apps/organiclever-web/Dockerfile` | `docker build -f apps/organiclever-web/Dockerfile -t organiclever-web:latest .` |

Both images run as non-root `app` user and use multi-stage builds for minimal size (~150-200MB).

## Development

For local development, use Docker Compose with `dev` profile:

```bash
npm run demo-be:dev
```

See [infra/dev/demo-be-jasb/README.md](../../dev/demo-be-jasb/README.md) and [infra/dev/organiclever-web/README.md](../../dev/organiclever-web/README.md)
