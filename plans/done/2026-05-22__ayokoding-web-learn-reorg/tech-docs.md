# Tech Docs — Learn-Tree Reorganization

## Tree Vocabulary (Authoritative)

This is the only place the tree's grammar is written down. Conflicts elsewhere defer to this section.

```
learn/                        — root
└── <domain>/                 — top-level discipline (6 currently)
    ├── _index.md             — TOC, generated
    ├── overview.md           — orientation
    └── <area>/               — sub-discipline; may include "tools" as a name
        ├── _index.md
        ├── overview.md
        └── <topic>/          — concrete subject (a language, a tool, a role…)
            ├── _index.md
            ├── overview.md
            └── <track>/      — exactly one of: by-concept | by-example | in-the-field
                ├── _index.md
                ├── overview.md
                └── *.md      — leaf content
```

**Glossary**:

- **Domain**: a top-level discipline. Today: `software-engineering`, `artificial-intelligence`, `information-security`, `it-governance`, `business`, `human`/`personal-development`.
- **Area**: a sub-discipline grouping inside a domain (`platforms`, `programming-languages`, `data`, `roles`, `tools`, etc.).
- **Topic**: a single subject of study (a language, an SDK, a role specialization).
- **Track**: the pedagogical lens — by-concept, by-example, in-the-field. Always the deepest folder layer.

The word `tools` is legal only as an **area** name. It is illegal as a **track** name.

## Authoritative Path Migration Table

Each row is a single `git mv`. Sub-content moves with the parent unless a sub-row says otherwise.

### Domain-Level Renames

| From           | To                            |
| -------------- | ----------------------------- |
| `learn/human/` | `learn/personal-development/` |

### Area-Level Renames

| From                                                        | To                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| `learn/software-engineering/platform-linux/`                | `learn/software-engineering/platforms/linux/`                |
| `learn/software-engineering/platform-web/`                  | `learn/software-engineering/platforms/web/`                  |
| `learn/software-engineering/platform-mobile/`               | `learn/software-engineering/platforms/mobile/`               |
| `learn/software-engineering/algorithm-and-data-structures/` | `learn/software-engineering/algorithms-and-data-structures/` |

### Track-Vocabulary Normalizations

These are the moves that fold non-canonical folder names into the three-track grammar.

| From                                                               | To                                                                    | Mechanism                                                               |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `learn/information-security/concepts/explanation/*`                | `learn/information-security/by-concept/*`                             | `git mv` per file; remove now-empty `concepts/`                         |
| `learn/information-security/foundations/by-example/*`              | `learn/information-security/by-example/foundations/*`                 | `git mv` per file or whole subtree; remove now-empty `foundations/`     |
| `learn/software-engineering/infrastructure/concepts/how-to/*`      | `learn/software-engineering/infrastructure/by-example/*`              | `how-to` = action-oriented → `by-example` per Diátaxis-to-track mapping |
| `learn/software-engineering/infrastructure/concepts/<other-files>` | `learn/software-engineering/infrastructure/by-concept/`               | non-how-to material is conceptual                                       |
| `learn/software-engineering/software-architecture/cases/*`         | `learn/software-engineering/software-architecture/by-example/cases/*` | cases are illustrative examples                                         |
| `learn/software-engineering/system-design/cases/*`                 | `learn/software-engineering/system-design/by-example/cases/*`         | same                                                                    |

### Explicit Non-Moves

These look like candidates but stay put.

| Path                                                                                                                                                                                                                                                                                                                                                               | Why it stays                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `learn/software-engineering/programming-languages/elixir/release-highlights/`                                                                                                                                                                                                                                                                                      | Domain-specific content type, not a generic track; lift to `in-the-field/release-highlights/` only if a parallel `release-highlights/` appears under another language |
| `learn/human/tools/cliftonstrengths/themes/{executing,influencing,relationship-building,strategic-thinking}/`                                                                                                                                                                                                                                                      | `themes/` is the CliftonStrengths content model, not a track; preserved inside `personal-development/tools/cliftonstrengths/`                                         |
| `learn/software-engineering/automation-tools/`, `learn/software-engineering/automation-testing/tools/`, `learn/software-engineering/infrastructure/tools/`, `learn/software-engineering/data/tools/`, `learn/software-engineering/platforms/web/tools/`, `learn/software-engineering/platforms/mobile/tools/`, `learn/software-engineering/platforms/linux/tools/` | `tools` as an **area** name is permitted; only `tools` as a **track** at leaf level is forbidden                                                                      |

## Diátaxis-to-Track Mapping

When folding Diátaxis-style labels into the three-track grammar:

| Diátaxis label                                                       | Track folder                                      |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| `tutorials/`                                                         | `by-concept/` (narrative learning)                |
| `how-to/`                                                            | `by-example/` (action-oriented walkthroughs)      |
| `reference/`                                                         | `in-the-field/` (production-grade, lookup-shaped) |
| `explanation/`, `concepts/`, `foundations/` (used as concept labels) | `by-concept/`                                     |
| `cases/`                                                             | nested under `by-example/cases/`                  |

This mapping is the rationale; it is not normative outside this plan.

## Migration Mechanics

### Use `git mv`, Always

`git mv old new` records the rename. Plain `mv` followed by `git add`/`git rm` may or may not be detected as a rename depending on similarity index. Always use `git mv` to keep `git log --follow` working.

For bulk renames inside a single subtree, do it one level at a time:

```bash
# Right (preserves rename detection):
git mv learn/software-engineering/platform-linux learn/software-engineering/platforms/linux

# Wrong (rename detection unreliable):
mkdir learn/software-engineering/platforms
mv learn/software-engineering/platform-linux/* learn/software-engineering/platforms/linux/
git add learn/software-engineering/platforms
git rm -r learn/software-engineering/platform-linux
```

### Cross-Link Rewrite

After each phase's `git mv`, search content for stale references and rewrite. The pattern:

```bash
# Discover stale references (search both the canonical site root /en/learn and any relative ../<old-folder>/ references)
rg "/en/learn/software-engineering/platform-linux\b" apps/ayokoding-web/content

# Rewrite in place (after dry-run confirms scope)
rg -l "/en/learn/software-engineering/platform-linux\b" apps/ayokoding-web/content \
  | xargs sed -i.bak 's|/en/learn/software-engineering/platform-linux\b|/en/learn/software-engineering/platforms/linux|g'
find apps/ayokoding-web/content -name '*.bak' -delete
```

Do this once per renamed prefix. Do not batch across multiple renames — single-rename rewrites are reviewable.

### Index Regeneration

Each phase ends with:

```bash
nx run ayokoding-web:generate-indexes
```

Then commit any `_index.md` changes the script produced. Do NOT run `--validate` mid-phase; let the script regenerate freely and review the diff.

### Link Validation

Each phase ends with:

```bash
cd apps/ayokoding-web
../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content
```

Zero broken links is the gate to proceed to the next phase.

### `_index.md` TOC References

Some `_index.md` files have hand-curated TOC entries (e.g., `learn/_index.md`, `learn/software-engineering/_index.md`). The generator script overwrites them, but the curated wording matters. After regeneration, diff against the previous version and reinstate any wording-only deltas.

## Redirect Map

The redirect table lives at `apps/ayokoding-web/src/redirects/learn-reorg.ts` (new file) and is imported into `next.config.ts`:

```typescript
// apps/ayokoding-web/src/redirects/learn-reorg.ts
export const learnReorgRedirects = [
  // Domain renames
  { source: "/en/learn/human/:path*", destination: "/en/learn/personal-development/:path*", permanent: true },
  { source: "/id/learn/human/:path*", destination: "/id/learn/personal-development/:path*", permanent: true },

  // Area renames — platforms
  {
    source: "/en/learn/software-engineering/platform-linux/:path*",
    destination: "/en/learn/software-engineering/platforms/linux/:path*",
    permanent: true,
  },
  {
    source: "/en/learn/software-engineering/platform-web/:path*",
    destination: "/en/learn/software-engineering/platforms/web/:path*",
    permanent: true,
  },
  {
    source: "/en/learn/software-engineering/platform-mobile/:path*",
    destination: "/en/learn/software-engineering/platforms/mobile/:path*",
    permanent: true,
  },

  // Area renames — algorithms
  {
    source: "/en/learn/software-engineering/algorithm-and-data-structures/:path*",
    destination: "/en/learn/software-engineering/algorithms-and-data-structures/:path*",
    permanent: true,
  },

  // Track normalizations — information-security
  {
    source: "/en/learn/information-security/concepts/explanation/:path*",
    destination: "/en/learn/information-security/by-concept/:path*",
    permanent: true,
  },
  {
    source: "/en/learn/information-security/foundations/by-example/:path*",
    destination: "/en/learn/information-security/by-example/foundations/:path*",
    permanent: true,
  },

  // Track normalizations — infrastructure
  {
    source: "/en/learn/software-engineering/infrastructure/concepts/how-to/:path*",
    destination: "/en/learn/software-engineering/infrastructure/by-example/:path*",
    permanent: true,
  },
  {
    source: "/en/learn/software-engineering/infrastructure/concepts/:path*",
    destination: "/en/learn/software-engineering/infrastructure/by-concept/:path*",
    permanent: true,
  },

  // Track normalizations — cases
  {
    source: "/en/learn/software-engineering/software-architecture/cases/:path*",
    destination: "/en/learn/software-engineering/software-architecture/by-example/cases/:path*",
    permanent: true,
  },
  {
    source: "/en/learn/software-engineering/system-design/cases/:path*",
    destination: "/en/learn/software-engineering/system-design/by-example/cases/:path*",
    permanent: true,
  },
];
```

Wire into `next.config.ts`:

```typescript
import { learnReorgRedirects } from "./src/redirects/learn-reorg";

const nextConfig = {
  async redirects() {
    return [...learnReorgRedirects];
  },
  // existing config…
};
```

**Ordering rule**: most specific redirects first. A redirect from `/concepts/explanation/:path*` must precede any catch-all like `/concepts/:path*`.

## Validation Scripts

Three local commands gate every phase. All three must return exit 0 before the phase commits.

```bash
# 1. Link integrity
cd apps/ayokoding-web
../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content

# 2. Index freshness
nx run ayokoding-web:validate-indexes

# 3. Test suite
nx run ayokoding-web:test:quick
```

Pre-push hook covers (3) and adds `typecheck`, `lint`, `spec-coverage`. The hook is the final local gate before push.

## Worktree Setup

Per the [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) (ose-public override), the entire plan runs inside one worktree.

```bash
# From parent ose-projects/ root, open ose-public-rooted Claude session
cd ose-public
claude --worktree ayokoding-web-learn-reorg

# Inside the worktree, the path is:
#   ~/ose-projects/ose-public/worktrees/ayokoding-web-learn-reorg/
# Branch: worktree-ayokoding-web-learn-reorg

# First-time setup inside worktree
npm install
npm run doctor -- --fix
```

The worktree is the only place `git mv` happens. Direct edits to the main checkout are forbidden during execution.

## Publish Path

Per the [Trunk Based Development Convention](../../../repo-governance/development/workflow/trunk-based-development.md) and the [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md), ose-public defaults to direct-to-main. This plan inherits that default:

1. All phase commits accumulate on `worktree-ayokoding-web-learn-reorg`
2. After all phases pass validation, fast-forward `main` into the worktree branch and push `main` to `origin`
3. Promote to production by fast-forwarding `prod-ayokoding-web` to `main` and pushing

The plan does NOT use a draft PR. Reviewer-of-record is the executor; the redirect map is a structural change with mechanical validation, not a judgment call.

## Things That Will Probably Surprise You

- **`_index.md` regeneration is destructive.** It rewrites the entire file from the directory tree. Any hand-curated text inside an `_index.md` body (not just frontmatter) is lost. Diff every regen.
- **The link checker compares against the live content tree, not against URLs.** It does not understand redirects. The plan validates redirects separately via `curl -I` against staging.
- **`generate-indexes.ts` is not idempotent across the version of itself in the worktree.** If the script is modified mid-plan (unlikely but possible), the regen output may shift. The plan does not touch the script.
- **The pre-push hook runs `affected -t spec-coverage`.** Folder renames invalidate the Nx affected cache; the first push after each phase will look like it's testing everything. This is expected; subsequent pushes are fast.
- **Redirects do not cascade.** If a user lands at `/en/learn/software-engineering/platform-linux/concepts/how-to/foo`, two redirects fire (platform-linux → platforms/linux, then concepts/how-to → by-example). Next.js handles this in a single 301 when source patterns are layered correctly [Judgment call — verify empirically in Phase 9 via `curl -IL`], but it is worth checking with `curl -IL` end-to-end.

## Open Questions (Resolve Before Execution)

1. **Vercel build minutes**: each push to `worktree-ayokoding-web-learn-reorg` triggers a preview build. Across ~10 phases × 1-2 pushes each = ~15-20 preview builds [Judgment call]. Confirm Vercel quota tolerates this.
2. **`apps/ayokoding-web/specs/`**: Gherkin specs reference URLs. Plan does not yet inventory them. Add to delivery checklist Phase 0 inventory step.
3. **External link cache**: `docs/metadata/external-links-status.yaml` (per `docs-link-checker` skill) caches the URL list. Not affected by this plan, but the link cache for `docs/` is separate from the content-tree link checker. Sanity-check after merge.
