---
description: "The adopted specs shape — one corpus per logical owner, carrying an index, a canonical as-built architecture.md, and a recursive behaviours/ tree"
when_to_use: "Read this when creating or validating a specs corpus for a logical owner, or when checking whether a spec area has adopted the shape."
---

# Logical Owner Corpus

## Adopted Shape

A specification corpus belongs to a **logical owner** — one shippable surface — not to a product
family. Each owner carries exactly three required entries:

```text
specs/apps/<product>/<owner>/
├── README.md          # index for the corpus
├── architecture.md    # canonical, current, as-built C4
└── behaviours/
    ├── README.md
    ├── <domain>/      # optional grouping
    └── *.feature
```

Libraries use the same three entries directly under `specs/libs/<library>/`.

`architecture.md` describes only the current as-built system and is updated in the same delivery
unit as the change that alters it. `behaviours/` is recursive: a feature file may sit at its root or
inside a domain directory.

## The Only Shape

This is the one shape a spec area is measured against. The retired five-folder C4 tree
(`product/`, `system-context/`, `containers/`, `components/`, `behaviour/`) is no longer a valid
layout in this repository, and no product is measured against it.

Adoption is detected positively. A product directory has adopted this shape as soon as one of its
immediate subdirectories carries an `architecture.md`; a library adopts it by carrying
`architecture.md` at its own root. A product holding no corpus at all is a HIGH `adoption`
finding, and any surviving retired folder beside a corpus is reported rather than tolerated — the
two together make the migration atomic per product.

## Why Owner Rather Than Product

A product family often ships several independent surfaces — a site, its backend, and a build tool.
Grouping their specifications under one product tree forces unrelated readers through the same
index and makes a single `architecture.md` describe systems that deploy separately. One corpus per
logical owner keeps each reader's entry point, C4 view, and behaviour corpus together, and lets a
dedicated E2E project link to its owner's corpus instead of growing a parallel tree.

## Enforcement

**Enforcement disposition — enforced.** `the declared spec-structure check` reports a missing
`README.md`, `architecture.md`, or `behaviours/` entry, an empty `behaviours/` tree, a missing
`behaviours/README.md`, and any surviving legacy folder beside a corpus. The command runs in
each owner's `test:coverage:behaviour`, which pre-push reaches through `test:quick`.

## Related

- [Canonical App Spec Tree](./canonical-app-spec-tree.md) — how many corpora a product holds, and
  what each entry answers.
- [Gherkin Feature File Placement and Lib Spec Structure](./gherkin-feature-file-placement-and-lib-spec-structure.md) —
  where a feature file goes inside `behaviours/`.
