# Architecture

The harness is one Go binary, `ayokoding-cli`. It reads course folders, decides what to run, drives
the container runtime through its command-line interface, and reports. It owns no server, no
database, and no stored state: every run starts from the files in the working tree.

## System Context

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Gray #808080
flowchart TD
  accTitle: Code harness system context
  accDescr: Content authors and CI call ayokoding-cli. The CLI reads course content in the working tree, reads changed paths from git, and starts containers through the Docker CLI. Container images come from public registries by digest. Plan 14 reads its coverage report.
  A["Content author<br/>or content plan<br/>agent"] --> C["ayokoding-cli"]
  CI["GitHub Actions<br/>(PR gate,<br/>monthly run)"] --> C
  P14["Plan 14<br/>end-state gate"] --> C
  C --> F["Course content<br/>apps/ayokoding-www/<br/>content/en/learn/<br/>courses"]
  C --> G["git<br/>(changed paths)"]
  C --> D["Docker CLI<br/>and daemon"]
  D --> R["Public registries<br/>(images by digest)"]

  classDef person fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef system fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
  classDef external fill:#808080,stroke:#000000,color:#000000,stroke-width:2px
  class A,CI,P14 person
  class C system
  class F,G,D,R external
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Containers (C4 Level 2)

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Gray #808080
flowchart LR
  accTitle: Code harness containers
  accDescr: The ayokoding-cli binary embeds the toolchain catalog and Dockerfiles. At run time it creates temporary working copies, toolchain images, environment images, run containers, and service containers on internal networks.
  B["ayokoding-cli binary<br/>(embeds catalog.yaml<br/>and Dockerfiles)"] --> T["Toolchain images<br/>(official by digest,<br/>derived built<br/>locally)"]
  B --> E["Environment images<br/>(toolchain +<br/>locked deps)"]
  B --> W["Temporary working<br/>copy of a code root"]
  B --> RC["Run container<br/>no network,<br/>read-only root"]
  B --> S["Service containers<br/>postgres, neo4j"]
  RC --> W
  RC --- N["Internal network<br/>(no route out)"]
  S --- N

  classDef main fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef runtime fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  classDef data fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
  class B main
  class T,E,RC,S,N runtime
  class W data
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Components (C4 Level 3)

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
flowchart TD
  accTitle: ayokoding-cli components
  accDescr: The Cobra adapter parses flags and renders output. Application use cases orchestrate pure domain packages through ports. Adapters implement the ports with the filesystem, git, and the container CLI. Bootstrap wires everything and is imported only by main.
  M["cmd/ayokoding-cli"] --> BS["internal/bootstrap"]
  BS --> CLI["adapters/cli<br/>(Cobra, render,<br/>exit)"]
  CLI --> APP["application<br/>(Validate, Sync,<br/>Run, Coverage,<br/>Check, Affected)"]
  APP --> DOM["domain<br/>(runspec, catalog,<br/>layout, anchors,<br/>containerplan,<br/>selection, coverage,<br/>simulation, finding)"]
  APP --> PORTS["ports declared<br/>in application"]
  CO["adapters/content"] -.implements.-> PORTS
  CT["adapters/containers"] -.implements.-> PORTS
  GI["adapters/git"] -.implements.-> PORTS
  BS --> CO
  BS --> CT
  BS --> GI

  classDef entry fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef core fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
  classDef adapter fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  class M,BS entry
  class APP,DOM,PORTS core
  class CLI,CO,CT,GI adapter
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

The deterministic core is `internal/domain/...` plus `internal/application`. Both are held to 99%
statement coverage by unit tests with no disk, process, or network access.

## Data Flow of `examples check`

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
sequenceDiagram
  accTitle: examples check sequence
  accDescr: The CLI discovers opted-in courses, validates and syncs all of them, computes the selection from git or flags, builds needed images, runs each selected unit twice in containers, compares outputs, and prints findings, a coverage report, and an exit status.
  participant U as Caller (Nx target)
  participant C as ayokoding-cli
  participant F as Course files
  participant G as git
  participant D as Docker
  U->>C: examples check --since origin/main
  C->>F: discover courses, units, run.yaml, lessons
  C->>C: validate layout, specs, catalog refs (all opted-in)
  C->>C: sync lessons against files (all opted-in)
  C->>G: changed paths since merge base
  C->>C: select affected opted-in courses (or full when toolchains/** changed)
  C->>D: pull pinned images, build derived and environment images
  loop each selected unit, each run
    C->>D: run container (cpus c), then again (cpus c/2)
    D-->>C: exit, stdout, stderr (twice)
    C->>C: compare the two, then compare with expectation
  end
  C->>C: coverage report (static)
  C-->>U: payload on stdout, progress on stderr, exit 0/1/2/124-127
```

## Inert Behaviour

The selection step first keeps only opted-in courses, meaning courses with a `run.yaml` somewhere in
their folder.

- With no opted-in course (the state of `main` when this plan merges), `examples check`:
  - validates and syncs nothing;
  - starts no container and contacts no registry;
  - prints `0 opted-in courses; nothing to run` and the coverage report;
  - exits 0.
- An affected course that is not opted in is listed as `inert`. It is never a finding.

## What Lives Outside the CLI

- **Teaching simulation code** lives in course folders (decision 37).
- **Rendering.** The Next.js app never calls the CLI and renders lessons exactly as before. The only
  change it sees is a Markdown comment line `<!-- harness: illustration -->`, which the renderer
  drops.
- **Plans 02 and 03 validation** stays in the app's TypeScript core and tests.
