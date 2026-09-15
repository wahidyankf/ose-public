# Specs Structure and C4 Contract

## Adopted Shape

[Web-cited] BeaverNest keeps each logical application corpus under
`specs/apps/<product>/<surface>/` with a README, canonical `architecture.md`, and recursive
`behaviours/`. Its
[architecture standard](https://github.com/wahidyankf/beaver-nest/blob/main/repo-governance/development/architecture-specifications.md)
requires current as-built C4 views, useful rather than mechanical detail, searchable constraints,
and same-change synchronization. Accessed 2026-08-30; excerpt: “The model describes only the
current, as-built system.” A second excerpt states: “Update `architecture.md` in the same change.”

[Judgment call] OSE adopts the coherence and lifecycle, with OSE-native spelling and product needs:

```text
specs/
├── README.md
├── apps/
│   ├── README.md
│   └── <product>/
│       ├── README.md
│       └── <logical-surface>/
│           ├── README.md
│           ├── architecture.md
│           ├── architecture/              # optional mapped split
│           ├── behaviors/
│           │   ├── README.md
│           │   ├── <domain>/               # optional domain grouping
│           │   └── *.feature
│           └── contracts/                  # optional, surface-owned
└── libs/
    ├── README.md
    └── <library>/
        ├── README.md
        ├── architecture.md
        └── behaviors/
            ├── README.md
            └── *.feature
```

## Target Owner Paths

| Logical owner                | Target corpus                      |
| ---------------------------- | ---------------------------------- |
| `ayokoding-www`              | `specs/apps/ayokoding/www/`        |
| `crane-cli`                  | `specs/apps/crane/cli/`            |
| `organiclever-app-web`       | `specs/apps/organiclever/app-web/` |
| `organiclever-be`            | `specs/apps/organiclever/be/`      |
| `organiclever-www`           | `specs/apps/organiclever/www/`     |
| `ose-app-web`                | `specs/apps/ose/app-web/`          |
| `ose-be`                     | `specs/apps/ose/be/`               |
| `ose-www`                    | `specs/apps/ose/www/`              |
| `rhino-cli`                  | `specs/apps/rhino/cli/`            |
| `wahidyankf-www`             | `specs/apps/wahidyankf/www/`       |
| each behavior-owning library | `specs/libs/<library>/`            |

The private sibling applies the same shape to `specs/apps/rhino/cli/`, `specs/libs/ts-ui/`, and
`specs/libs/ts-ui-tokens/`. It does not create entries for public-only products.

Dedicated E2E and inferred contract projects link to the owner's entry; they do not receive a
parallel spec tree. `ayokoding-www` keeps frontend, backend, and build-tool behaviors as domains
inside one logical owner unless Phase 1 evidence proves a separately shippable owner.

## C4 Required Coverage

Every logical application/tool corpus has a canonical `architecture.md` that:

- identifies scope, people, software systems, runtime/deployment containers, external interfaces,
  and relationships;
- shows persistent/temporary stores plus material process, network, security, and trust boundaries;
- includes a system-context view and every useful container view;
- includes component views only where they materially clarify responsibilities;
- records constraints and rationale in searchable prose when diagrams alone are unsafe;
- links to `behaviors/` and every implementing or dedicated E2E project README; and
- describes only the current as-built system, never a proposal.

For a library, `architecture.md` shows its consuming boundary and useful components/data flow rather
than inventing deployment containers. If there is genuinely no material C4 relationship beyond a
single value module, the README records the explicit exemption; current useful library C4 content
must not be discarded merely to claim that exemption.

## Scaling Rule

Keep one `architecture.md` while the context, containers, useful components, and constraints remain
legible at normal Markdown width. Split only when distinct readers, independent subsystems, diagram
legibility, repeated unrelated review noise, or separate traceability needs justify it.

When split:

- `architecture.md` remains canonical for scope, system context, shared constraints, and index;
- details live under `architecture/` by view/domain;
- every statement/diagram has one canonical home; and
- companions link back to their entry, relevant behaviors, and implementing projects.

## Change Discipline

Before changing production code, read the owner README, architecture, relevant Gherkin, and tests.
Record the architecture impact check in the delivery notes.

Update affected C4 views in the same delivery unit when implementation changes an actor, system,
container, component responsibility, relationship, interface, runtime/deployment boundary, store,
data flow, or security/trust boundary. Behavior-only or below-component implementation changes do
not cause diagram churn when every architectural statement remains accurate; record `No C4 change`
with evidence.

## Migration Method

1. In each repository, build a statement/diagram/link inventory for the old product,
   system-context, containers, components, behavior, contracts, and DDD trees; mark every
   DDD-specific specs artifact for deletion, never migration.
2. Establish the target owner README/architecture/behaviors entries without changing semantics.
3. Move Gherkin recursively, preserving git history where practical, and update all target inputs,
   bindings, README maps, and project links in the same delivery unit.
4. Consolidate current as-built C4 material into `architecture.md`; remove duplication and proposed
   or stale statements only with explicit evidence.
5. Move API contracts beside the surface that owns them; generated outputs remain governed and do
   not become hand-authored.
6. Delete the now-empty five-folder scaffolding and DDD paths after link, map, C4, Gherkin, and
   runtime gates pass.

## Deterministic Validation

The specs structure gate proves:

- every registered owner path exists with README, architecture disposition, and behaviors README;
- every README directory map matches disk;
- every feature has exactly one owner and every owner maps to project adapters;
- dedicated E2E projects link to and use the same corpus/architecture;
- every Mermaid diagram parses and meets accessibility rules;
- bidirectional specs ↔ implementation links resolve;
- no stale current link points at the retired five-folder/DDD paths; and
- optional `architecture/` companions are mapped exactly once from `architecture.md`.

Semantic review still judges whether C4 views are useful, as-built, complete, and understandable;
deterministic gates do not infer architecture quality.
