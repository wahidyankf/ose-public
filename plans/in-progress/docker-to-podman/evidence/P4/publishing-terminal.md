# docker-to-podman post-merge publication proof

## Merge

Pull request #749 merged by squash on 2026-10-29 after the PR quality gate passed on its exact head
`7660e498f` (every job passed; the Flutter job was skipped) and the pinned head was leak-reviewed. `origin/main` now
holds merge commit `f5f544fe7`, whose tree equals the PR head's tree (`git diff 7660e498f origin/main` is empty).

## Publication run

The merge to `main` triggered `publish-images` as designed (run 40773249804, head `f5f544fe7`). It concluded `success`.

| Job                     | Result  | What its log shows                                                                                                                                                                   |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Detect affected images  | success | Selected both backend images                                                                                                                                                         |
| Publish organiclever-be | success | `podman login ghcr.io --password-stdin` printed `Login Succeeded!`, `podman build --layers --format docker`, then `podman push` of two tags, `Writing manifest to image destination` |
| Publish ose-be          | success | The same sequence for `ose-be`                                                                                                                                                       |

Tags pushed per image, unchanged from before the migration: `ghcr.io/wahidyankf/<image>:latest` and
`ghcr.io/wahidyankf/<image>:<full merge commit SHA>` (`f5f544fe7f885394cf447667b022bb15b8187da5`), for `ose-be` and
`organiclever-be`. The `validate-env` run on the merge commit also concluded `success`.

## What was and was not verified

- Verified from the run: workflow trigger, credential-free login line, build with the Docker image format, both pushes
  for both images, and a successful job conclusion.
- Registry check (anonymous GHCR registry API, 2026-10-29): `ose-be:latest` and `ose-be:<merge SHA>` both resolve with
  HTTP 200 to digest `sha256:15e530e2611ba262f96498c2b2e764204952676c34756244c3cf5a4ec5e86d28`. `organiclever-be:latest`
  and `organiclever-be:<merge SHA>` both resolve to
  `sha256:69cd2e031b359d4c16a0f224597e7f387f54b29cc5ce6c5c2d774a0832d0e929`. Each image's two tags point at one digest,
  as the workflow intends. Both packages are readable anonymously.
- The pre-merge image runtime proof is in `evidence/P2/publishing.md`.

## Other runs on `main` seen after the merge

`non-product-full-quality-scheduled` failed on `main` at `de3bfa14d`, before this merge, on the `ferret-cli` integration
baseline described in `evidence/P2/ci.md`. The `organiclever-www-test-local-deploy-prod` workflow had failed on every
recorded scheduled run since 2026-10-26 at the Docker-era step `docker compose ... up --build -d`. After the merge it was
dispatched on `main` (run 40775591629) and concluded `success` on the Podman path: Detect changes, Quick gate, Static
behaviour coverage, Lint, Integration tests and E2E tests all passed, and the Deploy job was skipped by its own
condition. The `ose-www` and `ayokoding-www` prod workflows were not dispatched, because their Deploy job can push a
production branch; their next scheduled runs are the CI check for those two.

## Residual Docker references on `main`

A repo-wide search on `origin/main` (2026-10-29), excluding `plans/done`, `plans/backlog`, `plans/ideas`, learning
content, social posts and this plan, for `docker` followed by a CLI verb, `docker-compose` followed by a verb,
`DOCKER_HOST`, the Docker socket path, and the Docker GitHub actions, found only: the Docker-in-Docker sample GitLab
pipeline in the Next.js deployment explanation (a generic third-party example, not this repository's CI), Docker
technology teaching examples in the in-the-field tutorial conventions, and test fixtures that assert Docker calls are
rejected (`scripts/no-docker-binary-calls.test.mjs` and the public-safety cases). The four operational mentions the
search found were changed to Podman in #752. Compose files keep the name `docker-compose.yml`, and `Dockerfile`,
`.dockerignore` and `docker.io` stay by plan decision.
