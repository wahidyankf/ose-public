# Product requirements: Docker to Podman

## Users and outcome

The primary user is the maintainer running repository tasks on Ubuntu or macOS. CI is another
consumer of the same runtime contract. Course authors use `ayokoding-cli` indirectly through Nx;
they must not have to rewrite lesson material to accommodate the runtime migration.

All criteria below are required. Scenario IDs provide stable links from delivery actions to their
observable outcomes; they are not implementation order.

## Functional scope

| Area          | Required behavior                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prerequisites | Doctor requires Podman and `podman-compose`, and no longer requires the Docker executable.                                                            |
| Runtime       | Ubuntu and CI use rootless Podman; macOS uses a rootless Podman Machine connection.                                                                   |
| Compose       | Every supported entry point explicitly selects `podman-compose`; Docker Compose is never an implicit provider.                                        |
| Tests         | Existing app and example-runner assertions, coverage floors, resource limits, isolation, and exit contracts remain.                                   |
| Publishing    | Existing GHCR names, tags, credentials boundaries, and workflow triggers remain; native Podman builds and pushes replace Docker actions and commands. |
| Data          | Existing persistent data is retained, and any owned migration has a verified backup and restore path.                                                 |
| Documentation | Active operational instructions and generated bindings describe the tested Podman paths.                                                              |
| Ordering      | Podman precedes Phoenix; Phoenix precedes remaining work in live AyoKoding plans 06–14.                                                               |

## Acceptance criteria

### AC-01 — A supported host discovers the required tools

```gherkin
Scenario Outline: Doctor validates the container tools without Docker
  Given a supported <platform> with the repository's native prerequisites
  And Podman and podman-compose are installed
  And Docker is unavailable on the task's executable path
  When I run the repository doctor
  Then the container-tool checks pass
  And no missing Docker prerequisite is reported

  Examples:
    | platform |
    | Ubuntu   |
    | macOS    |
```

### AC-02 — Operational commands require rootless Podman

```gherkin
Scenario: A rootful default connection is rejected before workload creation
  Given the selected Podman connection reports rootful operation
  When I start a repository-managed container workflow
  Then it stops with a diagnostic describing the required rootless setup
  And it creates no workload containers
  And it does not invoke sudo or Docker as a fallback
```

### AC-03 — Compose selection is independent of other installed tools

```gherkin
Scenario: An installed Docker Compose provider cannot override the selected provider
  Given both Docker Compose and podman-compose are installed
  And the repository workflow explicitly selects podman-compose
  When I run a supported repository Compose stack
  Then podman-compose runs against rootless Podman
  And the stack passes its existing health checks on its existing ports
```

### AC-04 — The example runner preserves its execution contract

```gherkin
Scenario: An existing example produces the same observable result under Podman
  Given an existing opted-in example and its unchanged expected outputs
  And rootless Podman is the default container runtime
  When I check the example with ayokoding-cli
  Then its existing result and output assertions pass
  And the declared isolation and resource limits remain in effect
  And its temporary execution resources are removed
```

### AC-05 — Image builds use the same local image store as runs

```gherkin
Scenario: A derived toolchain and lockfile environment run without a registry copy
  Given a digest-pinned base image and an existing lockfile-bearing runner fixture
  When I build and run its derived toolchain and environment images
  Then both builds and the run use the selected Podman store
  And no harness-local image is fetched from an external registry
  And the content-derived image tags and structured CLI result shapes remain stable
```

### AC-06 — Environment failures and interruption remain distinguishable

```gherkin
Scenario Outline: Runtime failures retain their existing status contract
  Given the runner encounters <condition>
  When I check a runner fixture
  Then it exits with status <status>
  And the existing diagnostic contract for that condition is preserved

  Examples:
    | condition                       | status |
    | missing container executable    | 127    |
    | non-executable container command | 126    |
    | unavailable runtime             | 125    |
    | service readiness deadline      | 124    |
    | user interruption               | 130    |
```

Existing exemptions are revalidated against Podman; an exemption never authorizes stopping a
shared runtime or skipping an applicable test. A private failing fixture exercises unavailable
runtime and rootful-connection cases without changing another actor's engine.

### AC-07 — CI and publication keep their external behavior

```gherkin
Scenario: Container CI succeeds without using Docker tooling
  Given a repository container job configured with Podman and podman-compose
  And Docker executables are inaccessible to the workload process
  When the job builds its images and runs its declared tests
  Then its existing test gates pass
  And only the job's owned containers and networks are torn down
  And no Docker, Docker Compose, or Buildx command or action is required

Scenario: The existing backend publishing path retains its image contract
  Given the existing authorized backend publication trigger and GHCR credentials
  When its migrated workflow builds and publishes an affected backend image
  Then the existing repository and latest and commit-SHA tags are published
  And the published image can be inspected and started with Podman
  And no hosting cutover is performed
```

### AC-08 — Persistent data survives migration and rollback

```gherkin
Scenario: A disposable rehearsal restores persistent data without altering the source
  Given a disposable copy of an owned stack's persistent test data
  And a verified backup of that copy
  When I restore the backup into a new Podman volume
  Then application-level data checks match the source copy
  And the original Docker volume remains unchanged
  And the documented rollback can use the retained source and backup
```

### AC-09 — Learning content and peer work remain unchanged

```gherkin
Scenario: Operational migration leaves excluded content and worktrees intact
  Given recorded hashes for the AyoKoding learning-content trees
  And recorded revisions and dirty-path inventories for the existing Phoenix and plan-10 worktrees
  When this migration is delivered
  Then learning-content hashes are unchanged by this delivery
  And this plan has not changed files or Git state inside either peer worktree
  And neither paused plan was automatically resumed
```

### AC-10 — The dependency declarations and graph agree

```gherkin
Scenario: Remaining AyoKoding execution observes both prerequisites
  Given the new Podman plan and all currently live plans are indexed
  When I inspect their declarations and the plan-order graph
  Then Phoenix depends on the Podman plan
  And every live AyoKoding Learn Revamp plan depends on Phoenix
  And the existing course-series dependency edges remain
  And the graph is acyclic and includes each live plan exactly once
```

## Non-goals and compatibility

No application HTTP, tRPC, database schema, locale, or learner-data contract changes. No Vercel,
Tencent, Cloudflare, DNS, cloud account, or `ose-private` changes. No AyoKoding lesson rewrites,
golden regeneration, dependency upgrades unrelated to Podman, or production stack deployment.

`Dockerfile`, `.dockerignore`, Compose filenames, and `docker.io` may remain for compatibility.
The runner keeps `AYOKODING_CONTAINER_CLI`; Docker-specific Buildx cache configuration is retired
with its repository callers in the same delivery. A cross-job cache is not a requirement.
