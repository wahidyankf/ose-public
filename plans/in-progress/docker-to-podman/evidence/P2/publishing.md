# P2 publishing pre-merge proof (AC-07)

## Result and scope

The pre-merge part of AC-07 passed on 2026-10-28 on native rootless Podman 5.7.0. Both backend
images build, inspect, and start from the migrated Dockerfiles with temporary local tags, and the
registry steps handle authentication without credentials. **Actual GHCR publication has not run.**
The mandatory trigger, tag and digest verification, and the rootless inspect and start of the
published image happen only after merge, in the plan's terminal delivery audit.

## Image builds

Each image was built with the publish workflow's exact build command shape,
`podman build --layers --format docker -f apps/<app>/Dockerfile`, under HIPPO admission (ephemeral
class, heavy tier). The only differences were a local tag, `localhost/plan-p3/<app>:p3`, and the
owner label `plan=docker-to-podman-p3`. OpenAPI contract types were generated first with the
workflow's `nx run <app>:codegen` step, which passed for both.

| Image           | Build | Manifest type                                          | Platform    | Exposed port | Size     |
| --------------- | ----- | ------------------------------------------------------ | ----------- | ------------ | -------- |
| ose-be          | pass  | `application/vnd.docker.distribution.manifest.v2+json` | linux/amd64 | 8302/tcp     | 246.6 MB |
| organiclever-be | pass  | `application/vnd.docker.distribution.manifest.v2+json` | linux/amd64 | 8202/tcp     | 246.6 MB |

The Docker image format is preserved. No Docker shim call was recorded during any build or run.

## Start and read-only request

Started alone, each image runs its entrypoint and exits when `DATABASE_URL` is missing, which is the
application's documented requirement and not a runtime fault. Each image was then started on a
task-created network with a disposable PostgreSQL 17 and a disposable NATS container, using the
environment names from that app's existing end-to-end script. One existing read-only request per
backend was sent to the published host port:

| Backend         | Request              | Response                      | Specification                        |
| --------------- | -------------------- | ----------------------------- | ------------------------------------ |
| ose-be          | `GET /api/v1/health` | `200`, `{"status":"healthy"}` | ose-be health feature                |
| organiclever-be | `GET /health`        | `200`, `{"status":"ok"}`      | organiclever-be health-check feature |

## Registry authentication without credentials

The workflow's real login, build-and-push, and cleanup `run` blocks were extracted from
`publish-images.yml` and executed against a fake registry CLI that records its arguments and the
size of its standard input and never contacts a registry. The token was a fake string.

- `login ghcr.io --username <actor> --password-stdin --authfile <runner temp>/ghcr-auth.json`: the
  password arrived on standard input (the byte count equals the fake token's length) and the token
  appeared in **no** argument.
- The auth file existed after login and was gone after the cleanup step.
- `build --layers --format docker -f apps/<app>/Dockerfile -t ghcr.io/wahidyankf/<app>:latest -t
ghcr.io/wahidyankf/<app>:<commit sha> .` and a `push` of each tag, both with the same auth file.

## Unchanged publication contract

Compared with `main` before the migration: the four GHCR names and tags (`latest` and commit SHA for
`organiclever-be` and `ose-be`), the `push` trigger on `main`, the workflow permissions
(`contents: read`, `packages: write`), and the per-image affected-selection conditions are
identical. The only addition is `if: always()` on the two auth-file cleanup steps, so the ephemeral
file is removed even after a failed build or push.

## Owned teardown

The probe containers, the network, and the PostgreSQL anonymous volume were removed by name. Images
that existed before the proof were left alone. The temporary local tags and the base and layer
images the builds created are removed at the end of Phase 3, once its other builds finish.
