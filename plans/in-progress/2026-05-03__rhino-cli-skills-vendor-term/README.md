# Rhino-CLI: Add `\bSkills\b` to Vendor-Audit Scanner

## Context

The [Governance Vendor-Independence Convention](../../../governance/conventions/structure/governance-vendor-independence.md) lists nine forbidden vendor terms in its forbidden-terms table (line 63). One term — `\bSkills\b` (capitalized branded concept) — is present in the table but missing from two enforcement artifacts:

1. The convention's own combined audit regex on line 68 enumerates only eight terms.
2. The scanner at `apps/rhino-cli/internal/governance/governance_vendor_audit.go:28-41` enforces only the same eight terms.

Result: capitalized `Skills` (the branded concept, not the lowercase generic noun) sneaks past `rhino-cli governance vendor-audit` and the pre-push gate even though the convention forbids it. The vocabulary map in the convention prescribes lowercase "agent skills" as the neutral replacement.

This plan brings scanner + convention combined-regex into agreement with the convention table, then remediates the small set of existing capitalized `Skills` violations the new term surfaces in `governance/`. It is independent of the in-progress `2026-05-03__governance-vendor-neutrality` plan, which handles the broader vendor-prose rewrite (capability tiers, model-name removal, `.claude/` path replacement). This plan closes one specific scanner gap.

## Scope

**In-scope**:

- Add `\bSkills\b` entry to `forbiddenTerms` slice in `apps/rhino-cli/internal/governance/governance_vendor_audit.go`
- Sync convention's combined regex (line 68 of `governance/conventions/structure/governance-vendor-independence.md`) to include `\bSkills\b`
- Add per-term unit test in `apps/rhino-cli/internal/governance/governance_vendor_audit_test.go`
- Add Gherkin scenarios for capitalization sensitivity (capitalized fails, lowercase passes, fence-exempt) in `specs/apps/rhino/cli/gherkin/governance-vendor-audit.feature`
- Remediate existing capitalized `Skills` violations in `governance/` (replace with lowercase "agent skills" or "agent skill" per grammar)

**Out of scope**:

- Broader vendor-prose rewrite (capability tiers, `.claude/` path replacement, etc.) — owned by `2026-05-03__governance-vendor-neutrality`
- Lowercase "skills" usages — already convention-compliant
- The convention file's own `\bSkills\b` mention on line 63 — file is permanently allowlisted at `internal/governance/governance_vendor_audit.go:23` (`forbiddenConvention` constant)
- `.claude/`, `.opencode/`, `AGENTS.md`, `CLAUDE.md`, `plans/` content — explicitly out of scope per convention

**Affected subrepo**: `ose-public` only.

## Business rationale (condensed BRD)

**Why this matters**: An enforcement gap between a convention's prescriptive table and its enforcement scanner is invisible drift. Capitalized branded `Skills` slips through pre-push and CI gates undetected, so violations accumulate in `governance/` over time without triggering remediation. Closing the gap restores convention-as-enforced-rule rather than convention-as-aspiration.

**Affected roles**:

- Maintainer wearing the rhino-cli developer hat (extends scanner)
- Maintainer wearing the governance steward hat (cleans up surfaced violations)
- `repo-rules-checker` agent (consumes vendor-audit output)
- Future contributors writing governance prose (now correctly blocked from introducing `Skills` capitalized)

**Success metrics** (observable):

- `rhino-cli governance vendor-audit governance/` returns 0 violations after remediation (verifiable on demand)
- Combined regex on convention line 68 enumerates exactly the same nine terms as the table on line 63 (verifiable via grep)
- New unit + integration tests pass; rhino-cli test coverage stays ≥90%

**Non-goals**:

- Replacing all uses of the lowercase noun "skills" — the convention specifies only the capitalized branded form is forbidden
- Refactoring the broader skill architecture or platform-binding directories

**Risks and mitigations**:

- _Risk_: Adding a new forbidden term creates a churn wave across `governance/` if violations are widespread.
  _Mitigation_: Audit baseline first; expected scope is small (~8-12 spots, primarily `governance/development/agents/ai-agents.md`).
- _Risk_: New regex incorrectly matches benign occurrences inside link URLs or code spans.
  _Mitigation_: Existing `stripNonProse` exemptions (inline code, link URLs, HTML comments) and code-fence handling apply automatically — no new state required. Verified by existing exemption tests.

## Product requirements (condensed PRD)

**Personas**:

- _Maintainer (rhino-cli developer hat)_: extends `forbiddenTerms` slice, adds tests, runs unit + integration suite locally before push.
- _Maintainer (governance steward hat)_: runs scanner against `governance/`, edits prose to replace branded `Skills` with lowercase "agent skills".
- _Plan-executor agent_: drives the delivery checklist top to bottom; its only failure modes are TDD red-phase test failures (expected) and prose-cleanup misses (caught by the verification audit).
- _Future AI coding agents_ (Cursor, Codex CLI, Aider, etc.): inherit the corrected, vendor-neutral governance prose and the strengthened scanner without modification.

**User stories**:

- _As a_ maintainer extending the scanner, _I want_ adding a forbidden term to be a one-line change with a matching one-test addition, _so that_ the scanner stays simple and contributors can extend it without restructuring.
- _As a_ governance steward, _I want_ `rhino-cli governance vendor-audit` to flag every convention violation, _so that_ I do not need to manually grep for each forbidden term separately.
- _As a_ future contributor writing governance prose, _I want_ the pre-push hook to fail when I introduce capitalized `Skills`, _so that_ I learn about the convention violation before my commit lands on `main`.

**Acceptance criteria** (Gherkin):

```gherkin
Feature: Capitalized Skills is forbidden in governance prose

Scenario: Capitalized Skills branded term in plain prose fails the audit
  Given a governance markdown file containing "Use Skills to delegate work"
  When I run "rhino-cli governance vendor-audit"
  Then the audit fails with exit code 1
  And the finding suggests replacement with "agent skills"

Scenario: Lowercase agent skills phrase passes the audit
  Given a governance markdown file containing "Use agent skills to delegate work"
  When I run "rhino-cli governance vendor-audit"
  Then the audit passes with exit code 0

Scenario: Capitalized Skills inside a code fence is exempt
  Given a governance markdown file with "Skills" inside a fenced code block
  When I run "rhino-cli governance vendor-audit"
  Then the audit passes with exit code 0
```

**Product scope**:

- _In_: scanner term, convention regex sync, prose remediation in `governance/`.
- _Out_: lowercase "skills" usages, broader prose rewrite, platform binding directories.

**Product risks**:

- Capitalization-sensitive matching depends on Go's `regexp` library's `\b` word-boundary semantics — verified consistent with the existing `\bSonnet\b`, `\bOpus\b`, `\bHaiku\b` patterns already in the scanner.

## Technical approach

### Scanner change

`apps/rhino-cli/internal/governance/governance_vendor_audit.go:28-41` defines `forbiddenTerms` as a slice of `{re, displayTerm, replacement}` tuples. Add one entry:

```go
{regexp.MustCompile(`\bSkills\b`), "Skills", `"agent skills" (lowercase)`},
```

The new entry plugs into the existing `Walk()` → `ScanFile()` → `scanLines()` pipeline with zero new state. All existing exemption mechanisms apply automatically:

- Code fences (any backtick count ≥3, length-aware per CommonMark)
- `binding-example` fences (subset of code fences)
- "Platform Binding Examples" heading sections
- Inline code spans (stripped via `inlineCodeRe`)
- Link URL portions (stripped via `linkURLRe`)
- HTML comments (single- and multi-line)
- YAML frontmatter
- The convention definition file itself (allowlisted via `forbiddenConvention` constant on line 23)

### Convention combined-regex sync

`governance/conventions/structure/governance-vendor-independence.md:68` currently reads:

```
Claude Code|OpenCode|Anthropic|\bSonnet\b|\bOpus\b|\bHaiku\b|\.claude/|\.opencode/
```

Update to:

```
Claude Code|OpenCode|Anthropic|\bSonnet\b|\bOpus\b|\bHaiku\b|\.claude/|\.opencode/|\bSkills\b
```

This sync is required so the manual-grep escape hatch documented in the "Migration Guidance" section (line 145) matches what the scanner actually enforces.

### Test extension

Two test files extended:

1. **Unit test** — `apps/rhino-cli/internal/governance/governance_vendor_audit_test.go`:

   Add `TestScanLines_DetectsCapitalizedSkillsTerm` mirroring the pattern of `TestScanLines_DetectsModelTierTerms`. Assert that:
   - `"Use Skills to delegate work"` produces exactly one finding with `Match == "Skills"`.
   - `"Use agent skills to delegate work"` produces zero findings (lowercase is allowed).
   - `"Skills"` inside a fenced code block produces zero findings (existing exemption).

   Update `TestScanLines_MultipleForbiddenTermsSameLine` if it asserts a hard count of forbidden terms.

2. **Gherkin scenario** — `specs/apps/rhino/cli/gherkin/governance-vendor-audit.feature`:

   Add the three scenarios listed under Acceptance Criteria above. Existing step definitions in `apps/rhino-cli/cmd/steps_common_test.go` should already cover them — no new step impl required if the existing scenarios use generic "forbidden term" steps.

### Prose remediation strategy

After the scanner is upgraded, run `go run apps/rhino-cli/main.go governance vendor-audit governance/` to enumerate every capitalized `Skills` occurrence. Apply the vocabulary-map replacement from convention line 116:

| Old form (branded)                  | New form (neutral)                 |
| ----------------------------------- | ---------------------------------- |
| "Skills" (proper noun, capitalized) | "agent skills" (lowercase generic) |
| "Skills" used as singular           | "agent skill"                      |

Grammar review per file — preserve sentence structure; adjust article ("a Skill" → "an agent skill", "the Skills" → "the agent skills").

### Reusable assets (no new code paths)

- Walk + exemption pipeline: `Walk()`, `ScanFile()`, `scanLines()` — `internal/governance/governance_vendor_audit.go`
- Term-detection test pattern: `TestScanLines_DetectsModelTierTerms` (mirror for `Skills`)
- Convention file allowlist: `forbiddenConvention` constant — `internal/governance/governance_vendor_audit.go:23`
- Nx target `validate:governance-vendor-audit`: `apps/rhino-cli/project.json:97` (already wired into pre-push hook at `.husky/pre-push:26`)

### Rollback

If issues arise after merge:

1. `git revert` the scanner commit; `validate:governance-vendor-audit` returns to enforcing 8 terms.
2. Convention regex sync commit can be reverted independently; the table-vs-regex discrepancy returns but does not break enforcement.
3. Prose remediation commit can be reverted independently; lowercase replacements stay valid prose either way.

## Delivery checklist

### Phase 0: Worktree provisioning and toolchain

- [x] Provision worktree: `cd ose-public && claude --worktree rhino-cli-skills-vendor-term` (lands at `ose-public/.claude/worktrees/rhino-cli-skills-vendor-term/`)
- [x] Run `npm install && npm run doctor -- --fix` inside worktree to converge polyglot toolchain
- [x] Verify rhino-cli builds: `go run apps/rhino-cli/main.go --version`

### Phase 1: TDD Red — write failing tests first

- [ ] Add `TestScanLines_DetectsCapitalizedSkillsTerm` to `apps/rhino-cli/internal/governance/governance_vendor_audit_test.go`
- [ ] Add three Gherkin scenarios for capitalized fails / lowercase passes / fence-exempt to `specs/apps/rhino/cli/gherkin/governance-vendor-audit.feature`
- [ ] Run `nx run rhino-cli:test:unit` — expect failure on the new unit test
- [ ] Run `nx run rhino-cli:test:integration` — expect failure on the new Gherkin scenarios

### Phase 2: TDD Green — extend scanner

- [ ] Add `{regexp.MustCompile(\`\bSkills\b\`), "Skills", \`"agent skills" (lowercase)\`}`to`forbiddenTerms`slice in`apps/rhino-cli/internal/governance/governance_vendor_audit.go`
- [ ] Run `nx run rhino-cli:test:unit` — expect pass
- [ ] Run `nx run rhino-cli:test:integration` — expect pass

### Phase 3: Audit and remediate governance prose

- [ ] Run `go run apps/rhino-cli/main.go governance vendor-audit governance/` and capture full violation list
- [ ] Replace each capitalized `Skills` with lowercase `agent skills` (or `agent skill` for singular) per vocabulary map, preserving grammar (articles, pluralization)
- [ ] Re-run `go run apps/rhino-cli/main.go governance vendor-audit governance/` — expect 0 violations

### Phase 4: Sync convention combined regex

- [ ] Update `governance/conventions/structure/governance-vendor-independence.md` line 68 combined regex to include `\bSkills\b`

### Phase 5: Quality gates

- [ ] Run `npm run lint:md:fix && npm run lint:md` — expect 0 violations
- [ ] Run `npx nx affected -t typecheck lint test:quick spec-coverage` — all four targets pass
- [ ] Verify rhino-cli unit-test coverage stays ≥90%
- [ ] Verify no other governance file reintroduces capitalized `Skills` after lint:md:fix

### Phase 6: Commit and push

- [ ] Commit 1: `feat(rhino-cli): add Skills to vendor-audit forbidden terms` — scanner change + unit test + Gherkin scenarios
- [ ] Commit 2: `docs(governance): sync vendor-independence combined regex with forbidden table` — convention line 68 update
- [ ] Commit 3: `refactor(governance): replace branded Skills with lowercase agent skills` — bulk prose remediation
- [ ] Push directly to `origin main` per Trunk Based Development (no PR; ose-public default publish path)
- [ ] If any pre-push gate fails: fix root cause (do not bypass with `--no-verify`); re-stage; new commit; retry push

**Important**: Fix ALL failures found during quality gates, not just those caused by your changes — root cause orientation principle.

### Phase 7: Post-push CI verification

- [ ] Watch GitHub Actions for the push: `pr-quality-gate.yml` and any push-triggered workflows (markdown lint, link validation)
- [ ] If any CI check fails: fix immediately, push follow-up commit, monitor next run
- [ ] Confirm all CI checks pass before considering the work landed

### Phase 8: Plan archival

- [ ] Verify all delivery checklist items are ticked
- [ ] `git mv plans/in-progress/2026-05-03__rhino-cli-skills-vendor-term plans/done/`
- [ ] Update `plans/in-progress/README.md` (no change if entry was never added)
- [ ] Update `plans/done/README.md` — add plan entry with completion date
- [ ] Wait for the archival commit to land on `origin/main`
- [ ] Bump parent gitlink in `/Users/wkf/ose-projects/` to the new ose-public SHA, commit, push parent

## Quality gates

| Gate                      | Tool                                            | Pass condition                                               |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Unit tests                | `nx run rhino-cli:test:unit`                    | All pass; coverage ≥90%                                      |
| Integration tests         | `nx run rhino-cli:test:integration`             | All Gherkin scenarios pass                                   |
| Spec coverage             | `nx affected -t spec-coverage`                  | New scenarios mapped to step impls; no orphan steps          |
| Affected typecheck + lint | `nx affected -t typecheck lint`                 | All pass                                                     |
| Markdown lint             | `npm run lint:md`                               | 0 violations                                                 |
| Vendor audit              | `rhino-cli governance vendor-audit governance/` | 0 violations                                                 |
| Pre-push hook             | Husky                                           | All four targets pass for affected projects                  |
| Post-push CI              | GitHub Actions                                  | `pr-quality-gate.yml` and any push-triggered workflows green |

## Verification

End-to-end:

```bash
# Inside worktree

# 1. TDD red — new tests fail before scanner change
nx run rhino-cli:test:unit
nx run rhino-cli:test:integration

# 2. TDD green — after adding Skills to forbiddenTerms slice
nx run rhino-cli:test:unit
nx run rhino-cli:test:integration

# 3. Audit baseline — list violations to remediate
go run apps/rhino-cli/main.go governance vendor-audit governance/

# 4. After prose remediation
go run apps/rhino-cli/main.go governance vendor-audit governance/
# expect: GOVERNANCE VENDOR AUDIT PASSED: no violations found

# 5. Pre-push gate
nx affected -t typecheck lint test:quick spec-coverage
npm run lint:md:fix && npm run lint:md

# 6. Push and watch CI
git push origin main
gh run watch  # or background-monitor pattern from ci-monitoring.md
```

Spot-check after merge: open `governance/development/agents/ai-agents.md` and grep for `\bSkills\b` — should match nothing outside fenced regions; lowercase `agent skills` should appear in the prose where the branded form was previously used.
