---
description: Which paths no word-budget surface measures, and why.
when_to_use: Use when checking whether a file is actually measured.
---

# Unmeasured Paths

**A surface is exactly its declared glob.** `policies.governance.word-budget.surfaces` in
`repo-config.yml` has no exclude list, so a glob alone tells you what is measured. A path that
matches no glob is never counted.

| Not measured                                          | Why                                                             |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| Anything under `plans/`, `docs/`, or `specs/`         | Content trees; no surface glob names them                       |
| `.fvm/` and `.fvm-cache/`                             | Local Flutter SDK caches; no surface glob names them            |
| A `README.md` outside the trees the README globs name | README globs are declared tree by tree, never as `**/README.md` |

This is not a per-file waiver on an in-scope surface, which stays forbidden. Every hand-authored
`.agents/` source and its generated `.codex/` and `.opencode/` mirrors remain measured.

## The Practical Consequence

A `plans/**/README.md` of any length passes. Trimming one satisfies a budget that was never going
to be measured — verified by running `./rhino governance word-budget validate` against a fixture with
a 1200-word `plans/x/README.md` and a 1200-word `docs/README.md`: neither file was scanned.

## Related

- [Governance Word-Budget Convention](../governance-word-budget.md) — the surfaces and thresholds.
