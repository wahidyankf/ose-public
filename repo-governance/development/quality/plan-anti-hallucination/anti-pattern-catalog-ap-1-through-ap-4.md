---
description: "Version/path/target/name fabrication."
when_to_use: "Use as a checklist for AP-1 - AP-4."
---

# Anti-Pattern Catalog: AP-1 through AP-4

## Anti-Pattern Catalog

Each pattern below is a known hallucination shape. `plan-checker` admits occurrences to the ledger; the gate's repair pass rewrites them mechanically.

### AP-1: Citing a version without grep

> "We will use Next.js 16.0.0 with the new App Router..."

If `package.json` was not grep'd before writing, the version is hearsay. Verify or label `[Unverified]`.

### AP-2: Inventing a file path that "should exist"

> "Edit `apps/ose-www/src/lib/cache.ts`..."

Cache file may or may not exist at that path. `Glob` or `test -f` first. If NEW, write `_New file_` and add a creation step to the delivery checklist.

### AP-3: Citing an Nx target that may not exist

> "Run `nx run ose-www:integration-test`..."

Nx targets vary per project. Read `project.json` or run
`./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- show project ose-www` to enumerate
real targets. The actual target is `test:integration`, not `integration-test`.

### AP-4: Inventing a function or method name

> "Wrap with `unstable_cacheTagged(fn, tags, options)`..."

Fabricated API. Real Next.js 16 surface is `unstable_cache(fn, keyParts, options)` plus `revalidateTag(tag)`. Check official docs (or delegate to `web-researcher`) before writing the API surface.
