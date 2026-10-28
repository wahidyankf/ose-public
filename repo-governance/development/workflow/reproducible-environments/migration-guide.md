---
description: Step-by-step migration paths for adding Volta pinning or Podman Compose to an existing project.
when_to_use: Use when retrofitting Volta version pinning or Podman Compose into a project that does not yet have them.
---

# Migration Guide

## Adding Volta to Existing Project

1. **Install Volta** (team members):

   ```bash
   curl https://get.volta.sh | bash
   ```

2. **Pin versions** (project maintainer):

   ```bash
   volta pin node@24.13.1
   volta pin npm@11.10.1
   ```

   This updates package.json with volta field.

3. **Commit changes**:

   ```bash
   git add package.json
   git commit -m "chore: pin Node.js and npm versions with Volta"
   ```

4. **Update documentation** (README.md):
   - Add Volta to prerequisites
   - Update setup instructions
   - Document how Volta auto-manages versions

## Adding Podman Compose to Existing Project

1. **Create docker-compose.yml** (the standard Compose file name is kept; run it with `podman compose`):

   ```yaml
   version: "3.8"
   services:
     postgres:
       image: docker.io/library/postgres:16.1
       # ... configuration
   ```

2. **Create Dockerfile.be.dev**:

   ```dockerfile
   FROM docker.io/library/node:24.13.1-alpine
   # ... configuration
   ```

3. **Update .gitignore**:

   ```
   # Container volume data
   .docker/
   docker-volumes/
   ```

4. **Document Podman usage**:
   - Add rootless Podman and the `podman-compose` provider to prerequisites
   - Provide `podman compose up` instructions, with `PODMAN_COMPOSE_PROVIDER` set
   - Document how to access services
