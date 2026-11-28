# parity

Logic for the parity tools that `cmd/parity` runs: the URL inventory of the old ayokoding site and the gap report
against the new app. It holds no process state. Every file read, directory tree, write, and HTTP request goes through a
`Host`, so unit tests run over in-memory doubles, and `OSHost` is the only operating-system wiring.

## Files

- `parity.go` — `Host`, `OSHost`, and `Run`, the subcommand dispatch with its exit codes (2 for usage, 1 for unreadable or
  malformed input). It finds the repository root as the nearest directory with `repo-config.yml`.
- `inventory.go` — `BuildInventory` (sitemap paths, the redirect export, and route patterns, sorted and deduplicated, with
  no host) and `RoutePatterns` (locale roots expand to `en` and `id`; the tRPC transport and dynamic segments are left out).
- `gapreport.go` — `GapReport` (one request per URL, classified by status only) and `RenderGapReport` (markdown with
  counts, one row per URL, and one row per cause group).
- `host.go` — `newFetch`, the single-GET probe, and `noFollow`, which keeps a redirect as the reply.

Behaviour is specified in `specs/apps/ayokoding/web/behaviours/parity-tools/parity-tools.feature` and bound at Unit,
Integration, and E2E level.
