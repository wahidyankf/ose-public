---
description: The hard no-secrets requirement for post-mortems, guidance for using accessible Mermaid diagrams, and worked filename and action-item table examples
when_to_use: Read this when redacting sensitive values from a post-mortem, adding a diagram, or checking a filename or action-item table against PASS/FAIL examples.
---

# No Secrets Rule, Diagrams, and Examples

## No Secrets Rule

Post-mortems are committed to git and become permanent record. Apply the
[No Secrets in Git](../../security/no-secrets-in-committed-files.md) rule without exception.

Use placeholders for any sensitive identifier that appears in timelines, log excerpts, or
configuration references:

| Type                    | Example placeholder   |
| ----------------------- | --------------------- |
| API token or key        | `<api-token>`         |
| Database connection URL | `<db-connection-url>` |
| Environment variable    | `<env-var-value>`     |
| SSH private key         | `<ssh-key>`           |
| Third-party webhook URL | `<webhook-url>`       |

Name the placeholder and state where the real value lives (e.g., "stored in `.env.local`, never
committed"). Never include the actual value.

## Diagrams

Use accessible Mermaid diagrams (color-blind-safe palette) where they clarify causal chains
or triage sequences. A well-placed diagram costs less than a missed ambiguity.

Follow the [Diagrams Convention](../../formatting/diagrams.md) and
[Color Accessibility Convention](../../formatting/color-accessibility.md). Use only the verified
WCAG AA hex codes: `#0173B2` (blue), `#DE8F05` (orange), `#029E73` (teal), `#CC78BC` (purple),
`#CA9161` (brown), `#808080` (gray).

## Examples

### Filename examples

| PASS: Correct                                                 | FAIL: Wrong                                      | Reason                                                        |
| ------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| `2026-06-04-github-actions-nx-affected-stall.md`              | `post-mortem-github-actions-2026.md`             | No incident date prefix; year is not an ISO date              |
| `2025-11-01-organiclever-www-vercel-deploy-failure.md`        | `2025-11-01__organiclever-www__vercel.md`        | Double underscores are for `plans/` folders, not post-mortems |
| `2025-09-14-organiclever-be-coverage-threshold-regression.md` | `2025-09-14-OrganicleverBe-Coverage.md`          | Uppercase components                                          |
| `2026-03-20-amazonq-binding-parity-guard-break.md`            | `docs/how-to/post-mortems/parity-guard-break.md` | Wrong Diátaxis tier; post-mortems are explanation, not how-to |

### Action item table

PASS — well-formed action item table:

```markdown
| #   | Action                                                               | Owner      | Priority | Ticket                            | Status |
| --- | -------------------------------------------------------------------- | ---------- | -------- | --------------------------------- | ------ |
| 1   | Add generated binding dirs to .prettierignore                        | Maintainer | P0       | plans/backlog/prettierignore-fix/ | Open   |
| 2   | Add parity-guard smoke test to pre-push hook for .amazonq/ artifacts | Maintainer | P1       | —                                 | Open   |
| 3   | Evaluate Rhino emit-bindings idempotency on re-run                   | Maintainer | P2       | —                                 | Open   |
```

FAIL — action item anti-patterns:

| FAIL: Wrong      | Reason                                              |
| ---------------- | --------------------------------------------------- |
| "Fix the CI"     | Not specific, not verb-led to a concrete outcome    |
| Owner = "Team"   | Too vague; use a role ("Maintainer", "SWE on-call") |
| Ticket = (empty) | Must be `—` or a real reference; blank is ambiguous |
| All items P0     | Priority loses meaning if everything is P0          |
