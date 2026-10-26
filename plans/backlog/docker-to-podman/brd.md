# Business requirements: Docker to Podman

## Problem

`ose-public` depends on Docker in its development setup, container-backed testing, image publishing,
and AyoKoding example runner. Merely replacing the development command would leave CI and the
runner on a different runtime. That split would make future infrastructure work harder to verify
and would send contributors through inconsistent setup and recovery instructions.

The maintainer has selected Podman for the whole operational repository. This plan establishes
that foundation before the Phoenix rewrite and the remaining AyoKoding content programme continue.

## Goal and affected roles

The maintainer and future contributors can use one documented rootless container toolchain for
supported local workflows and CI. Course authors keep their existing lesson files and observable
example results while the underlying runner changes. Consumers of published backend images keep
the existing image locations and tags.

## Success measures

Success is demonstrated by evidence, rather than an assumed performance or cost improvement:

- Supported operational workflows pass on Podman with Docker unavailable to those processes.
- Ubuntu, CI, and macOS verification demonstrate rootless execution and the selected provider.
- Current app and runner contracts pass without changing course content or reducing safeguards.
- Data restoration is demonstrated on a disposable copy before any owned persistent data moves.
- Documentation, toolchain checks, rules, generated bindings, and the live plan DAG agree.

No baseline for runtime speed, image size, or infrastructure cost is claimed. Cold CI builds may
take longer when the former Buildx cache is removed; correctness is the acceptance boundary.

## Business scope

The migration covers this repository's operational use of containers, from a contributor's first
setup through tests and the already-existing image publication path. Existing native toolchains
remain native; Podman does not replace Node.js, Go, .NET, or the repository's HIPPO/Rhino consumers.

Business non-goals are the Vercel exit, cloud account setup, Tencent/Cloudflare configuration,
production server management, DNS, private-repository operations, a new product release, and
editing or re-teaching AyoKoding lesson material.

## Constraints and risks

| Risk                                                         | Required response                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Docker and Podman have separate storage and ownership models | Inventory and preserve Docker data; rehearse restore into a new Podman volume before switching an owned stack. |
| Rootless permissions or resource control differ across hosts | Prove UID/GID mapping, writable mounts, cgroup limits, and networking; stop on unsupported capabilities.       |
| CI succeeds only because Docker is preinstalled              | Audit all callers and run runtime checks with Docker inaccessible to the tested process.                       |
| An active plan later restores Docker-specific code           | Record the worktree checkpoints and require reconciliation before Phoenix or plan 10 resumes.                  |
| The change expands into a hosting migration                  | Keep registry names and deployment routes; record private-hosting follow-ups without implementing them here.   |
| Unsupported old scaffolds appear to gain support             | Keep their existing unsupported status and validate syntax only; do not promise startup parity.                |

The migration preserves other sessions' work and state. A failed verification is a reason to repair
the cause or stop with evidence, never to delete peer artifacts or relax a test.
