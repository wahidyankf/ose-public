# Preliminary Delivery Audit — FERRET Init 01

Audited head: `6771f87752a932261d568fefcc4c9ec639f7cb89` with the DU-01 change set still in the working tree, before the candidate commit.
Every path is relative to `plans/in-progress/ferret-init-01-local-cli/` unless it starts with `apps/`, `specs/`,
`docs/`, or `repo-governance/`. A row reads PASS only when the file it cites exists and, for a RED, GREEN, or
REFACTOR packet, when its recorded exits have the required shape: RED starts with a failing exit, GREEN and
REFACTOR end with exit 0. `build-audit.py` (a scratch script, not shipped) checks that shape and refuses to write
this document on any gap; it holds no blocking row.

## 1. Acceptance criteria

The twelve AC packets, from `evidence/phase-5/trace.txt`. Test counts are `def test_` functions in the named
Unit, Integration, and E2E files.

| AC        | Title                                          | Scenarios | Tests (unit / integration / e2e) | Packet (RED, GREEN, REFACTOR)                   | Manual and measured evidence                                                                                                             | Result |
| --------- | ---------------------------------------------- | --------- | -------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC-CLI-01 | Initialize one private machine store           | 1         | 13 / 17 / 0                      | `phase-3/ac-cli-01-{red,green,refactor}.txt`    | `phase-5/manual-capture.txt`, `phase-5/manual-query.txt`, `phase-5/manual-install.txt`                                                   | PASS   |
| AC-CLI-02 | Capture strict metadata                        | 2         | 73 / 10 / 0                      | `phase-3/ac-cli-02-03-{red,green,refactor}.txt` | `phase-5/manual-capture.txt`                                                                                                             | PASS   |
| AC-CLI-03 | Reject content and unknown fields              | 1         | 28 / 2 / 0                       | `phase-3/ac-cli-02-03-{red,green,refactor}.txt` | `phase-5/manual-capture.txt`, `phase-4/smoke.txt`                                                                                        | PASS   |
| AC-CLI-04 | Keep the harness fail-open                     | 2         | 52 / 23 / 15                     | `phase-4/adapters-{red,green,refactor}.txt`     | `phase-4/smoke.txt`, `phase-5/manual-capture.txt`, `phase-4/gate-adapters.txt`, `phase-4/gate-bindings.txt`, `phase-4/gate-projects.txt` | PASS   |
| AC-CLI-05 | Preserve concurrent local capture              | 1         | 13 / 10 / 12                     | `phase-3/ac-cli-05-{red,green,refactor}.txt`    | `phase-5/storage.txt`, `phase-5/retention.txt`                                                                                           | PASS   |
| AC-CLI-06 | Show unknown instead of zero                   | 1         | 53 / 19 / 0                      | `phase-3/ac-cli-06-{red,green,refactor}.txt`    | `phase-5/manual-query.txt`, `phase-4/smoke.txt`                                                                                          | PASS   |
| AC-CLI-07 | Query and export deterministic events          | 2         | 78 / 14 / 17                     | `phase-3/ac-cli-07-08-{red,green,refactor}.txt` | `phase-5/manual-query.txt`                                                                                                               | PASS   |
| AC-CLI-08 | Report operational proxies honestly            | 1         | 29 / 6 / 0                       | `phase-3/ac-cli-07-08-{red,green,refactor}.txt` | `phase-5/manual-query.txt`                                                                                                               | PASS   |
| AC-CLI-09 | Enforce thirty-day retention                   | 1         | 19 / 15 / 0                      | `phase-3/ac-cli-09-{red,green,refactor}.txt`    | `phase-5/retention.txt`, `phase-5/retention-fixture-refactor.txt`                                                                        | PASS   |
| AC-CLI-10 | Diagnose space without hiding high-water usage | 1         | 48 / 13 / 8                      | `phase-3/ac-cli-10-{red,green,refactor}.txt`    | `phase-5/storage.txt`, `phase-5/storage.json`, `phase-3/storage.json`                                                                    | PASS   |
| AC-CLI-11 | Remain fully standalone                        | 1         | 11 / 0 / 2                       | `phase-3/ac-cli-11-{red,green,refactor}.txt`    | `phase-5/manual-capture.txt`, `phase-5/manual-query.txt`                                                                                 | PASS   |
| AC-CLI-12 | Preserve install and removal boundaries        | 2         | 50 / 38 / 18                     | `phase-3/ac-cli-12-{red,green,refactor}.txt`    | `phase-5/manual-install.txt`                                                                                                             | PASS   |

Every one of the 38 expanded scenarios is bound in the Unit and Integration step files of `ferret-cli` and in
the E2E step files of `ferret-cli-e2e` (`evidence/phase-5/automatic-projects.txt`: 6 features and 38 scenarios
in each project).

## 2. Contract, hash, and snapshots

| Contract                                                                      | Proof                                                                                                                                                                                                                                                                                                     | Result |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Closed metadata envelope, canonical bytes, and event hash                     | Vectors computed independently of the module (`apps/ferret-cli/tests/unit/test_event_contract.py`, `test_canonical.py`, `test_event_identity.py`, `test_identifier_derivation.py`; A21); a stored event and its duplicate report the independently computed hash in `evidence/phase-5/manual-capture.txt` | PASS   |
| Capability snapshot key, cascade, producer-owned idempotency, atomic rollback | `apps/ferret-cli/tests/unit/test_capabilities.py`, `apps/ferret-cli/tests/integration/test_capability_repository.py`; `evidence/phase-3/ac-cli-06-green.txt`                                                                                                                                              | PASS   |
| Unknown is never zero                                                         | `apps/ferret-cli/tests/unit/test_analytics.py`, `evidence/phase-5/manual-query.txt` (a null bucket sorts last), `evidence/phase-4/smoke.txt` (Codex skill stays unknown)                                                                                                                                  | PASS   |
| No content reaches the data home                                              | `apps/ferret-cli/tests/unit/test_privacy.py`, the byte-level leak checks of live Claude Code, Codex, and OpenCode stores in `evidence/phase-4/smoke.txt`                                                                                                                                                  | PASS   |

## 3. Counters and numeric prune

| Rule                                                                                                                | Proof                                                                                                                      | Result |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------ |
| Thirty-day cutoff: a row is hidden when `expires_at <= now`                                                         | `apps/ferret-cli/tests/integration/test_retention.py`; `evidence/phase-5/retention.txt` (reads expose no expired row)      | PASS   |
| The first unlocked operation removes at most 100 expired rows and leaves the rest; a locked attempt changes nothing | `evidence/phase-5/retention.txt`, `retention.sha256`, `retention-fixture-refactor.txt` (a separate process holds the lock) | PASS   |
| Explicit maintenance removes the remainder once, and repeating it removes nothing more                              | `evidence/phase-5/retention.txt`; `apps/ferret-cli/tests/unit/test_maintenance.py`                                         | PASS   |
| `expiredLocalTotal` counts every expired row once and `expiredBeforeAckTotal` is zero                               | `evidence/phase-5/retention.txt`; `apps/ferret-cli/tests/unit/test_maintenance.py`                                         | PASS   |
| The maintenance marker changes only when nothing expired remains                                                    | `evidence/phase-5/retention.txt` (a partial prune leaves it unchanged)                                                     | PASS   |

## 4. Install manifest and rollback

| Rule                                                                                                                                                                                                       | Proof                                                                                                                                                                                            | Result |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| The manifest is the only ownership proof and is trusted only as a private regular file with the closed schema; unowned files are never touched                                                             | `apps/ferret-cli/tests/unit/test_install.py`, `apps/ferret-cli/tests/integration/test_install.py`, `apps/ferret-cli-e2e/tests/test_user_install.py`, `evidence/phase-5/manual-install.txt` (A19) | PASS   |
| Install is staged and manifest-last, so a crash is repaired by installing again; uninstall removes the launcher, artifact, directory, and manifest in that order so it can be finished by running it again | The same three test files; `evidence/phase-3/ac-cli-12-green.txt`, including the Linux procedure                                                                                                 | PASS   |
| A killed run after a partial commit resumes with an exact once-only count                                                                                                                                  | `evidence/phase-3/ac-cli-09-green.txt`                                                                                                                                                           | PASS   |
| A failed snapshot write rolls back atomically                                                                                                                                                              | `apps/ferret-cli/tests/integration/test_capability_repository.py`                                                                                                                                | PASS   |

## 5. Rules propagation Steps 0 to 8

| Step                           | Proof                                                                                                                                                                                                                                                   | Result |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Steps 0 to 8                   | `evidence/phase-1/step-0.txt` to `step-8.txt`, `step-6-{red,green,refactor}.txt`; the manifest for run `7d7e3e` records Steps 0 to 8 complete, zero open enforcement rows, and Step 9 as pending in the same pull request (`evidence/phase-1/gate.txt`) | PASS   |
| Adapter drift                  | `evidence/phase-4/gate-bindings.txt`, `evidence/phase-5/automatic-governance.txt` (the pinned adapter validation exits 0)                                                                                                                               | PASS   |
| The private-sibling obligation | Recorded, not executed, with objective `ferret-python-harness-governance` (`evidence/phase-1/step-8.txt`)                                                                                                                                               | PASS   |

## 6. Storage

| Rule                                                                                                                                                                                    | Proof                                                                                                                     | Result |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| 919.5 bytes per event is inside the 0.7 to 1.5 KiB envelope; the three steady-state projections sit inside the BRD ranges; every capture p95 is far inside the one-second hook deadline | `evidence/phase-5/storage.txt`, `storage.json`, and `evidence/phase-3/storage.json` (byte figures identical in both runs) | PASS   |
| The reported high-water mark equals the observed peak; compaction leaves no free pages or log                                                                                           | `evidence/phase-5/storage.txt`                                                                                            | PASS   |

## 7. Automatic and manual proof

| Proof                                                                                                                                                                              | Evidence                                                                                                                    | Result |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| Owner quick, E2E quick, Integration, and E2E suites, uncached (Unit 1224 passed at 100.00% coverage, Integration 331, E2E 150)                                                     | `evidence/phase-5/automatic-projects.txt`                                                                                   | PASS   |
| Static behaviour coverage of both projects, the pinned adapter validation, repository configuration, and instruction word budgets; the workflow lint and artifact-retention checks | `evidence/phase-5/automatic-governance.txt`, `ci.txt`                                                                       | PASS   |
| Documentation checks                                                                                                                                                               | `evidence/phase-5/automatic-docs.txt`, `evidence/phase-6/learnings.txt`                                                     | PASS   |
| Three manual cases (capture, query, install) and the retention run, each closed, isolated, and hash-checked                                                                        | `evidence/phase-5/manual-capture.txt`, `manual-query.txt`, `manual-install.txt`, `retention.txt`, `manual-summaries.sha256` | PASS   |
| Live harness smoke, per harness, verified or unverified stated                                                                                                                     | `evidence/phase-4/smoke.txt`                                                                                                | PASS   |
| Phase 5 gate: pre-push exit 0, twelve AC lines, no flagged word                                                                                                                    | `evidence/phase-5/gate.txt`                                                                                                 | PASS   |
| Non-goals: ten absence checks all exit 1 with no match                                                                                                                             | `evidence/phase-5/trace.txt`                                                                                                | PASS   |

## 8. File ledger

`python3 local-tmp/claude/ledger-check.py` at generation: ledger_paths=210 changed_paths=305 changed_not_in_ledger=0 ledger_not_yet_changed=3 (later-phase paths)

Every changed path is named by `evidence/phase-0/file-ledger.pathspec` (the plan folder counts as one entry); the
three later-phase paths are the archive move and its index and activation edits, staged by Phase 6 after the
candidate check.

## 9. Deviations, learnings, and the boundary

- Execution amendments, as of this audit: 30 rows in `delivery.md` (A1 to A30), each with its finding and
  evidence. Phases 6 and 7 added more; `delivery.md#execution-amendments` carries the final set.
- Knowledge capture, as of this audit: 20 rows in `learnings.md`, each with one terminal status
  (`evidence/phase-6/learnings.txt`); the five rows reported without plan authorization were handed to the
  user. Phases 6 and 7 added more rows; `learnings.md` carries the final set and its own status split.
- Not applicable, by the plan's own scope: UI, browser, design, usability, and HTTP or API exploratory testing.
- Still to run, by design after this audit: the candidate commit and its independent check, the archive move,
  the pull request with its exact-head checks, the merge, the terminal audit, and cleanup.

## 10. Verdict

No blocking row. Every acceptance criterion, contract, counter, prune rule, install rule, rules step, storage
figure, and manual and automatic proof traces to evidence that exists and has the required shape.
