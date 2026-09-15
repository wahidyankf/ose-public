---
title: "Target-State repo-config.yml — SDLC Gate Registry Enforcement"
description: The complete post-change repo-config.yml for each of the four repos, copied in during execution
category: explanation
subcategory: plans
tags:
  - ci-cd
  - rhino-cli
  - parity
created: 2026-08-02
---

# Target-State `repo-config.yml`

One file per repo, holding the **complete `repo-config.yml` as it should look after this plan lands**
— every existing section reproduced verbatim from that repo's current file, plus the `gates:` section
this plan adds. Execution copies from here, so the four registries are reviewable side by side before
any repo is touched.

| File                                                                   | Repo                | Formatters | Registry notes                                             |
| ---------------------------------------------------------------------- | ------------------- | ---------- | ---------------------------------------------------------- |
| [`repo-config-ose-public.yml`](./repo-config-ose-public.yml)           | `ose-public`        | 13         | Canonical. Prunes the one dead Clojure entry               |
| [`repo-config-ose-primer.yml`](./repo-config-ose-primer.yml)           | `ose-primer`        | 10         | Polyglot. Prunes 0, **adds** shfmt and sql/html globs      |
| [`repo-config-private-sibling.yml`](./repo-config-private-sibling.yml) | The private sibling | 4          | Prunes 5, adds shfmt and tofu. Carries the `iac-lint` pair |
| [`repo-config-beaver-nest.yml`](./repo-config-beaver-nest.yml)         | `beaver-nest`       | 5          | Prunes 9                                                   |

## Before copying, re-verify the unchanged part

Each file opens with a `# TARGET STATE` banner that must **not** be copied into the repo. Everything
between the banner and `gates:` is that repo's current content. The three OSE target files retain the
content captured on 2026-08-02 and were reverified on 2026-08-04; the `beaver-nest` target was
refreshed twice on 2026-08-04: first after its backend allowlist/runtime changes, then at
`cd2ec0e4d` after the Vite migration removed its frontend environment-contract and injection data.
These repos are edited concurrently by other actors, so confirm nothing else has landed since:

```bash
# Compare existing YAML while excluding the target-state banner, the deliberately
# amended header comments, and the new gates section.
OSE_REPOS_ROOT=/path/to/ose-checkouts
TARGET_REPO=ose-public
TARGET_ARTIFACT=repo-config-ose-public.yml
diff <(sed -n '/^harness:/,/^gates:/p' "$TARGET_ARTIFACT" | sed '$d' | sed '$d') \
     <(sed -n '/^harness:/,$p' "$OSE_REPOS_ROOT/$TARGET_REPO/repo-config.yml")
```

Repeat with the explicit pairs `ose-primer`/`repo-config-ose-primer.yml`,
the private sibling/`repo-config-private-sibling.yml`, and
`beaver-nest`/`repo-config-beaver-nest.yml`.

Verified against all four current `main` refs on 2026-08-04: the command above prints nothing. Each
per-repo file carries the same command in its own banner.

A non-empty diff is a Phase 0 finding: reconcile it rather than overwriting, or the copy silently
reverts someone else's change.

## Why the entry sets differ

Gate entry **sets** are data and legitimately differ per repo; the **schema** and the engine reading
it do not. This is the same rule that already lets the private sibling carry an `iac-lint` pair the others
lack — see
[tech-docs §2.3](../tech-docs.md#23-why-gate-sets-may-differ-per-repo-but-the-schema-may-not).

Formatter counts differ under the presence rule: a formatter is declared **if and only if** the repo
has at least one tracked file matching its glob, measured by `git ls-files`. The counts behind each
number above are in
[tech-docs §2.2.4](../tech-docs.md#224-the-full-formatter-and-per-file-inventory).

The presence rule also applies to each extension inside a multi-extension prettier glob. Therefore
`sql` is absent from Beaver's prettier mutation and verifier because Beaver tracks zero `.sql`
files; expected future use does not satisfy the current tracked-file requirement.

## Structural findings these files surfaced

- **Every target declares `doctor:`.** `ose-public` and `beaver-nest` select their .NET SDK source
  with `dotnet-global-json`; `ose-primer` omits it because its two backend pins differ, and skips
  only `tofu` and `clang-format`; the private sibling declares no exclusions. `ose-primer` no longer skips
  `shfmt`, because its target registry declares the formatter.
- **Every live repo header says "all three repos"**, and the section list is already inconsistent.
  The target headers instead describe a shared schema across all four repos and list the same eight
  concrete sections: `harness`, `coverage`, `specs`, `instruction-size`, `env-contract`,
  `env-injection`, `doctor`, and `gates`. The schema-parity gate validates each file against the
  schema rather than requiring identical values. Measure after copying with:

  ```sh
  OSE_REPOS_ROOT=/path/to/ose-checkouts
  for TARGET_REPO in ose-public ose-primer <private-sibling> beaver-nest; do
    sed -n '/Sections defined here/,/^$/p' "$OSE_REPOS_ROOT/$TARGET_REPO/repo-config.yml" | grep -c '^#   [a-z]'
  done
  ```

  Acceptance: returns 8 for every repository.

The `harness.amazonq.agent-name` field is also per-repository data. It is the generated Amazon Q
agent-definition filename stem and embedded definition name: `ose-default` in the OSE repositories
and `beaver-nest-default` in Beaver. Keeping it in `repo-config.yml` prevents shared Rust source
from hardcoding a repository-specific identity.

## Related

- [tech-docs §2.2](../tech-docs.md#22-registry-location-and-shape) — the field contract these files conform to
- [husky-hooks/](../husky-hooks/README.md) — the hook shims that invoke these gates
- [package-json/](../package-json/README.md) — the `lint-staged` block emitted from these gates
