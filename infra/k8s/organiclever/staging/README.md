# Staging Environment

**Status**: Placeholder - Kubernetes manifests to be added

**Spring Profile**: `staging`
**Configuration**: `apps/organiclever-be/src/main/resources/application-staging.yml`

**Docker images**: Same Dockerfiles as production (`apps/organiclever-be/Dockerfile`, `apps/organiclever-fe/Dockerfile`). Override Spring profile via `SPRING_PROFILES_ACTIVE=staging` env var.

Planned resources:

- Deployment manifests
- Service definitions
- Ingress rules
- ConfigMaps and Secrets
