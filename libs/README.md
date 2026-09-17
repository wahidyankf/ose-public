# Shared Libraries

`libs/` holds code that more than one OSE application can use. Start with an app when you are
learning the product; come here when you need to understand a capability shared across apps.

## What is here

- `fsharp-crane-core/` — the F# core used by the Crane PDF-to-Markdown tooling.
- [`web-ui/`](./web-ui/README.md) — shared web interface building blocks.

Each library owns its own README, build targets, and tests. The current workspace structure is the
source of truth; do not assume a planned library exists just because a naming pattern supports it.

## How libraries fit into OSE

OSE applications may import libraries, but applications do not import one another. Libraries should
remain focused, avoid circular dependencies, and expose a small public surface appropriate to their
language. This keeps product work easier to change without turning the monorepo into one tightly
coupled application.

## Work with a library

Use Nx to discover the target names available today:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- show projects
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- show project <project-name>
```

Then run the target shown by that project, for example:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build <project-name>
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run <project-name>:test:quick
```

For the repository-wide boundaries and naming rules, read the
[monorepo structure reference](../docs/reference/monorepo-structure.md). For a new reusable
capability, begin with the relevant application and library README before choosing where it belongs.
