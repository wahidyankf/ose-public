# P3-Inventory mechanism checks

Run before the GREEN steps that depend on them, per the unit's reality-check list.
Paths are sanitized: the worktree is `<repo>`, the home directory is `<home>`, and the scratch directory is `<tmp>`.

## 1. go:embed in a scratch module (Go 1.27.1, local toolchain)

Scratch module at `<tmp>/embed-check`, with `testdata/www-redirects.json` and `testdata/_underscore.json`.

- `//go:embed testdata/www-redirects.json` in the same package, with `import _ "embed"`: builds and runs. Output `18 8` (the two file sizes in bytes), exit 0.
- An explicit file name beginning with `_` (`testdata/_underscore.json`) embeds: confirmed by the `8` above.
- A pattern containing `..` (`testdata/../testdata/www-redirects.json`) is refused:

```
bad.go:5:12: pattern testdata/../testdata/www-redirects.json: invalid pattern syntax
exit=1
```

Consequence: the Go export is embedded from `internal/web/testdata/` with a plain relative path. No `..` pattern is used.

Note: the first two attempts failed on my own scratch source (an unused `embed` import, then a missing `_ "embed"` import). Those were fixes to the probe, not findings about `go:embed`.

## 2. Node import of the www redirect modules (Node v24.16.0)

Command run from the worktree root.

Importing `apps/ayokoding-www/next.config.ts` directly fails:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '<repo>/apps/ayokoding-www/src/environment-bootstrap' imported from <repo>/apps/ayokoding-www/src/env-loader.ts
```

Loading the six redirect modules by explicit `.ts` path, in `next.config.ts` order, with `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON`, succeeds:

- rules: 87
- rules with `permanent: false`: 3
  - `/en/learn/software-engineering/software-architecture/by-example`
  - `/en/learn/software-engineering/system-design/by-example`
  - `/en/learn/information-security/by-example`

The export command in `delivery.md` (P3-Inventory GREEN) is therefore used as written: it imports the six modules by explicit path and does not import `next.config.ts`.

## 3. Source-gap check (already recorded in the plan)

`apps/ayokoding-web/internal/web/redirects.go` lists 36 rehomed slugs, and `REHOMED_COURSE_SLUGS` in `course-rehome.ts` has 37. This is re-read at the start of the unit and carried into the gap report, not fixed here.
