# Knowledge Capture Routing Verification (Step 5h): Terminal States and Secret/Sensitivity Gates

## 1. Knowledge Capture Routing Verification (Step 5h — MANDATORY BLOCKING GATE)

Enforces the
[Knowledge Capture Convention](../../../../repo-governance/development/quality/knowledge-capture.md).
This is a **blocking gate** — run it BEFORE the plan is allowed to archive to `plans/done/`. A plan
MUST NOT be archived until every `learnings.md` entry is verified terminal and both safety gates are
confirmed satisfied.

### What to Validate

1. **Every entry reached a terminal state** — read `learnings.md` (or confirm the explicit
   `No generalizable learnings — <reason>` escape if the file is absent or empty). Each surviving
   entry MUST record exactly one of:
   - **Routed inline** (non-code homes only — `docs/`, `repo-governance/`, `.claude/agents/`,
     `.agents/skills/`, post-mortems, or any other non-code durable home) — confirm the referenced
     commit or file edit actually landed in this plan's own history.
   - **Filed as a `plans/ideas/<slug>.md` two-pager** — valid only with literal plan-artifact
     authorization after the mandatory overlap scan. Confirm the scan evidence and that the file
     exists: `rtk ls plans/ideas/<quadrant>/<slug>.md`. Knowledge Capture MUST NOT create, move, or
     write under `plans/backlog/`; a backlog artifact filed this way is invalid even when a maintainer
     instruction appears to sanction it, and only the idea-promotion workflow may promote a ripe
     idea into a formal backlog plan.
   - **Reported without plan authorization** — required for a plan-worthy future learning when no
     literal authorization exists. Confirm the report location or conversation handoff evidence.
   - **Discarded with a one-line reason** — confirm a concrete reason is present, not merely the word
     "discarded". An entry with no terminal state recorded, or left silently open: **CRITICAL**
     finding — archival is BLOCKED until resolved.
2. **No code-homed learning landed inline** — cross-check `learnings.md` against this plan's own
   commit history/diff for any learning whose home is `apps/`, `libs/`, or a test file that was
   implemented directly in this plan's commits/PR instead of filed to `plans/ideas/`. Any code born
   from a learning that landed inline in the current plan — outside the narrow current-plan-blocker
   carve-out (Root Cause Orientation: fixing a genuine blocker to finish this plan's own scope) — is a
   **CRITICAL** finding — archival is BLOCKED.
3. **Secret/sensitivity gate satisfied** — `Grep` `learnings.md` for credential-shaped strings
   (connection strings, API keys, tokens, raw IPs/hostnames outside a `<placeholder>` token). Any
   unsanitized secret found: **CRITICAL** finding — archival is BLOCKED. This inherits the
   [No Secrets in Git Convention](../../../../repo-governance/conventions/security/no-secrets-in-committed-files.md)
   hard iron rule in full.
