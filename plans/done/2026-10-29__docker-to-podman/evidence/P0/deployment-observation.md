# P0 deployment observation capability

## Scope and probe

On `2026-10-26`, the execution worktree remained at baseline revision
`71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`. Read-only tracked-file metadata identifies
`vercel.json` under the three public sites and both application web projects. Their planned
container-runtime changes therefore require the workflow's Phase 0/resume capability probe,
even though this delivery does not change hosting.

The current harness tool catalog exposes no authenticated Vercel operation. A resource-list
probe against the configured `vercel` MCP server failed during initialization with
`Auth required`. This establishes **present but unauthenticated**, not an available authenticated
connection. No deployment or platform operation ran and no authentication was attempted.

## Verification fallback

Use the repository's documented degraded mode for the existing terminal hosting observation:

- Observe any deployment already triggered by this delivery through its deploy-branch Git
  history and the corresponding CI run, recording the exact revision.
- Request existing public URLs over HTTP and record response status and relevant headers;
  record the serving revision only where it is exposed.
- Record a deployment that did not run as not-run. Do not claim platform provenance, cache
  internals, invocation counts, or successful deployment from an HTTP response alone.
- Diagnose an existing CI deployment failure through its job log. No new deployment is
  triggered merely to verify this document.

The plan requires no per-route invocation-volume measurement, so no dashboard-only proof or
additional human authentication step is needed. The terminal action remains executable through
the allowed fallback; re-probe if deployment observation later fails. This changes neither an
acceptance criterion nor the installation, publication, or local runtime proof obligations.

See the [Vercel capability convention](../../../../../repo-governance/development/infra/vercel-mcp.md)
and its [degraded-mode rule](../../../../../repo-governance/development/infra/vercel-mcp/identifier-hygiene-degraded-mode-and-when-to-check.md).
