# docs-link-checker Cache and Workflow

`docs-link-checker` diverges from this skill's generic 7-day-TTL cache sketch: it uses a
**per-link 6-month expiry** cache at a single fixed path, with mandatory full-scan bookkeeping.
This module documents that specific contract.

## Cache File — Hard Requirements

**Path**: `docs/metadata/external-links-status.yaml` — the ONLY permitted cache file; never create
an alternative. Committed to git, shared across the team, contains only verified links (broken
links are never cached).

**Mandatory on every run, regardless of invocation method** (direct, spawned by another agent, or
automated process — no exceptions):

1. Update the `lastFullScan` timestamp (`YYYY-MM-DDTHH:MM:SS+07:00`, via
   `TZ='Asia/Jakarta' date +"%Y-%m-%dT%H:%M:%S+07:00"`) — even if zero links were checked.
2. Prune cache entries for links no longer present in any documentation file.
3. Add newly verified links; update `usedIn` location metadata for existing ones.
4. Sort links by URL (stable git diffs); use 2-space YAML indentation.

**Fields**: `version` (schema, `1.0.0`), `lastFullScan`, `description`, `links[]` (each with
status, redirect target if any, `usedIn` file paths, `lastChecked`). Cache stores file paths only
— no line numbers; broken-link line numbers are looked up dynamically when writing the audit
report, so the cache stays stable across doc edits and reports never show stale locations.

## Two Required Outputs

Every run produces both: the cache file above (permanent, operational) AND an audit report at
`local-tmp/docs-link/docs-link__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md` (temporary, findings +
fix recommendations — no automated fixer exists for this agent, so the report drives manual
remediation).

## Discovery and Extraction

Glob `docs/**/*.md`. Extract external URLs with `https?://[^\s\)]+`; extract internal links with
`\[([^\]]+)\]\((\./[^\)]+\.md)\)`.

## Validation Workflow

No lifecycle gate validates internal links, so both branches below always run, along with the
mandatory cache bookkeeping. `./rhino md internal-link validate` (on demand) reports missing target
files but does not check `#fragment` anchors.

**External** (cache-integrated): load cache → for each URL, check per-link expiry (6 months since
its own `lastChecked`) → skip if fresh, else WebFetch with redirect tracking → handle 403s
(Wikipedia/government sites commonly block automation — treat as inconclusive, not broken) →
update cache entry → after all links processed, prune orphaned entries → save.

**Internal**: resolve the relative path from the source file's location, verify the target exists
via Glob/Read, report with the expected path if missing.

## Common Issues

External: Wikipedia/NIST/government 403s (bot-blocking, not broken), corrupted or moved PDF links,
genuine 404s (page removed or site reorganized). Internal: typos/renamed files, wrong `../` depth,
missing `.md` extension (required per the Linking Convention).

## Fixing Broken Links

External: read the file, identify what the link was meant to reference, WebSearch for a current
URL, Edit to replace, re-verify. Internal: read the file, determine the correct target, Glob to
locate it, calculate the correct relative path, Edit to correct, verify the target exists.

Editing rules: preserve the link's display text, change only the URL/path, keep markdown
formatting, remove the entire link if no replacement exists, always keep `.md` on internal links.
