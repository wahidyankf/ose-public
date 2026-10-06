# Post-Deploy Verification (Vercel MCP)

Applies after Pattern 1 or Pattern 2 (not Pattern 3 — test-only workflows have no deploy step).

A successful push is **not** evidence of a successful deploy. Vercel builds asynchronously, so a push
that lands and a build that fails look identical from the shell. The `Deployed successfully` message
in the push step confirms only that the branch moved — it says nothing about the build. Verify before
reporting success.

1. Confirm a deployment exists for the agent's Target Parameters project slug (team
   `wahidyan-kresna-fridayokas-projects`) whose commit SHA matches the SHA just pushed. A stale
   newest-deployment means the build has not been picked up yet.
2. Follow its state until it leaves `BUILDING`, then report the terminal state:
   - `READY` — the deploy succeeded. Report the deployment URL and the aliases it serves.
   - `ERROR` — fetch the build logs, surface the failing step, and report **failure**.
   - `CANCELED` — report it; usually a superseding deploy raced this one.
3. Address the project by **slug, never by an opaque `prj_*`/`team_*` identifier**, in every message
   and committed artifact.

**If the Vercel MCP is unavailable**, say so explicitly, then fall back to the deploy branch's CI run
and an HTTP request against the live URL. Never report a successful deployment on the strength of the
push alone — that is the specific failure this section exists to prevent.

See [Vercel MCP Capability Convention](../../../../repo-governance/development/infra/vercel-mcp.md).
