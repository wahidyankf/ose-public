# Defensive Security (By Example)

**Course ID**: `defensive-security` · **Format**: By Example.

**Scope note**: Hands-on generalist blue-team practice over invented telemetry: log sources, parsing and
normalization, central collection, detection rules (a signature, a statistical baseline, and the Sigma shape),
alert severity and false positives, indicators and hunting, YARA-shaped file rules, the incident-response
lifecycle with containment and recovery, zero trust, hardening, deception, response automation gates, ATT&CK
coverage, and purple-team loops. Every unit reads synthetic files in its own folder. The course leaves out
Wazuh decoders and correlation-rule authoring, dashboard operations, and specialist tuning
(`detection-engineering-and-siem-operations` follows this course), offensive technique (`offensive-security`),
and policy and compliance (`it-governance-grc`)
([tech-docs/005](../../tech-docs/005-security-content-and-accuracy.md#what-each-security-course-teaches-and-where-it-stops)).

**Short summary**: Attackers leave evidence, and defenders win by collecting it, turning known behavior into
tested rules, and rehearsing the response. You build each step as a small program over invented logs and see it
work.

## Why this exists · the big idea

- **The problem before the solution**: an attack that leaves no useful telemetry is found too late, and a
  detection nobody tests fires on everything or nothing. Defenders learn tools by dashboard, so they cannot say
  why a rule is noisy or why a response step was out of order.
- **Keep-this-if-you-forget-everything**: centralize trustworthy telemetry, turn a known behavior into a rule with a
  test, rate and tune its alerts, rehearse the response in order, and harden the weakest exposed control. Then
  measure what you cover.

## Learning objectives

- Choose log sources for a question, parse them, and normalize two shapes into one schema.
- Write detection rules as tested code, including a portable Sigma-shaped rule, and map them to ATT&CK.
- Rate alert severity, measure false positives, and tune a threshold with the trade-off visible.
- Match indicators and run a hypothesis-driven hunt, and say why behavior outlasts a hash.
- Walk the incident-response lifecycle in order: scope, contain, eradicate, recover, and learn.
- Apply zero-trust tenets as policy code, and review a segmentation matrix and a deny-by-default firewall.
- Build a coverage matrix and find gaps, and gate detection changes in a test.

## Prerequisites

- **Prior courses**: `offensive-security`, `it-and-application-security`, `just-enough-bash`, and (added by this
  plan, [tech-docs/001](../../tech-docs/001-current-state.md#prerequisite-changes)) `just-enough-python`.
- **Assumed knowledge**: reading JSON, basic shell commands, the difference between an authentication event and
  an application request. No production log access is required.

## Mode and targets

- **Mode**: By Example. **Reason**: each telemetry, detection, and response step becomes a runnable check over
  synthetic events: a tabletop is a state machine that refuses an out-of-order step, a zero-trust tenet is a
  policy function that denies a request
  ([tech-docs/002](../../tech-docs/002-course-modes-and-definition-of-done.md#mode-selection)).
- **Examples**: 78 (floor 75), 26 per level. **Words**: at least 28,000. **Diagrams**: 36 marked `[D]` (band 30–50).
- **Metadata**: `format: by-example`; `category: security`; `description` kept from plan 03 ("Detect attacks,
  respond to incidents, and stop them from happening again."); `prerequisites` gain `just-enough-python`;
  `estimatedHours` from the drift test.
- **Safe-lab rules**: S1 to S7 of [tech-docs/005](../../tech-docs/005-security-content-and-accuracy.md#safe-lab-rules-for-the-two-security-courses)
  apply. The boundary banner appears once at the top of each level page (S4), never under each example.

## Defects found 2026-10-09

- All 78 headings follow one pattern over one repeated body (unique-body ratio 0.04); the course's text is 12,255
  words, of which most is the same boundary banner and the same template in each example.
- One script, `blue_lab.py` (174 lines, 10 subcommands), stands behind all 78 examples: examples differ by a number
  and a name. The drilling page has 246 words and no katas. The capstone's side page `ir-report.md` (234 words)
  sits outside the layout the harness accepts.
- The course states ATT&CK facts and a Sigma version without a source or a date.
- The optional OpenSearch import snippet shows a `curl` to a loopback address. It stays as prose, marked an
  illustration, with no unit behind it.

## Accuracy notes

- MITRE ATT&CK Enterprise v19.2 has 15 tactics including Stealth (TA0005) and Defense Impairment (TA0112), read
  on 2026-10-09 (`attack.mitre.org/tactics/enterprise/`). The course ships the tactic list as a versioned data
  file and states the version; the maker re-reads the page (rule A3) and applies S7.
- Sigma: the specification is split into rules, correlation, filters, modifiers, tags, and taxonomy documents
  (`sigmahq.io/sigma-specification/`); the maker records the specification version and the field taxonomy used.
  Examples use a small subset of the rule format and say so.
- Incident response: NIST SP 800-61 Rev. 3 (April 2025) supersedes Rev. 2 and frames response through CSF 2.0.
  The older prepare / detect / contain / eradicate / recover sequence is taught as a teaching model, labelled as
  such, with the mapping to the CSF functions shown in ex-42. The six CSF 2.0 function names are read from NIST,
  with an access date.
- Zero trust: NIST SP 800-207 (the tenets, the policy decision and enforcement points) and the CISA Zero Trust
  Maturity Model; the maker fetches both.
- Suricata rule syntax, YARA rule syntax, and OpenSearch `_bulk` format are read from each project's
  documentation, with versions and access dates. No engine runs; the units parse and evaluate the shapes.
- The Pyramid of Pain (D. Bianco, 2013) is cited to its source. Hardening examples are original, inspired by
  published baselines; no benchmark text is copied (rule A7).
- No example uses a real address: SEC1 applies (reserved addresses only), and `.example` or `.test` hostnames only.

## Concepts

- **co-01 · defender-roles** — blue, red, and purple teams and what each produces.
- **co-02 · log-source** — what a source is, and how to choose one for a question.
- **co-03 · parsing** — a raw line becomes named fields.
- **co-04 · central-collection** — many sources are merged into one ordered stream.
- **co-05 · siem-flow** — collect, normalize, store, detect, alert, and open a case.
- **co-06 · normalization** — different shapes map to one schema.
- **co-07 · signature-detection** — match known patterns.
- **co-08 · anomaly-detection** — compare behavior with a baseline.
- **co-09 · network-rule-shape** — the parts of an IDS rule.
- **co-10 · detection-as-code** — a rule is versioned, tested code.
- **co-11 · sigma-structure** — `logsource`, `detection`, and `condition`.
- **co-12 · portable-rules** — backend-neutral rules and a field mapping per backend.
- **co-13 · endpoint-telemetry** — process and parent-child events.
- **co-14 · ids-and-edr-placement** — what a sensor can and cannot see from where it sits.
- **co-15 · attack-matrix** — tactics, techniques, and the version in force.
- **co-16 · indicators** — types of indicator, matching, and ingesting a list safely.
- **co-17 · behavior-over-indicators** — the cost to the attacker of changing each indicator type.
- **co-18 · csf-functions** — Govern, Identify, Protect, Detect, Respond, Recover.
- **co-19 · alert-severity-and-false-positives** — severity levels, precision, recall, and thresholds.
- **co-20 · hunting** — hypotheses, pivots, sweeps, and promoting a hunt to a rule.
- **co-21 · file-rules-and-sample-review** — YARA-shaped rules, static review, and a sandbox checklist.
- **co-22 · ir-lifecycle** — the stages, a playbook, and a tabletop.
- **co-23 · scoping-and-evidence** — scoping, precursors against indicators, and evidence handling.
- **co-24 · contain-eradicate-recover** — ordered steps and a verified clean restore.
- **co-25 · learning-from-incidents** — a blameless note.
- **co-26 · zero-trust** — tenets as policy, with decision and enforcement separate.
- **co-27 · segmentation-and-firewalls** — reachability and default deny.
- **co-28 · hardening** — controls checked against a baseline; attack-surface reduction.
- **co-29 · patching-and-findings** — a finding inventory, a patch loop, and prioritization.
- **co-30 · deception** — a decoy nothing legitimate touches.
- **co-31 · response-automation** — enrichment and approval gates.
- **co-32 · alert-fatigue-and-tuning** — volume against capacity; safe suppression with an expiry.
- **co-33 · purple-team-coverage** — expected against observed telemetry, and a coverage matrix.
- **co-34 · correlation-and-change-control** — joining sources, timelines, and gating rule changes.

## Worked examples

Each unit reads the shared synthetic fixtures under `learning/code/` (the event stream, the intel list, the
asset inventory, and the rule files). Small helpers extracted from ex-03 and ex-08 live in a shared `labkit.py`
that those two lessons show in full. Rule files are YAML and need the PyYAML lock.

### Beginner (`learning/beginner.md`, Examples 1–26)

- **ex-01 · blue-red-purple-roles** — a role-to-artifact table printed from data — verify the pairs. (co-01) [D]
- **ex-02 · choose-events-worth-logging** — rank candidate log sources by whether they answer a stated question
  — verify the ranking for two questions. (co-02)
- **ex-03 · parse-a-raw-log-line** — turn an authentication line into fields — verify the fields and a rejected
  malformed line. (co-03)
- **ex-04 · centralize-telemetry** — merge two source files into one time-ordered stream — verify the count and
  order. (co-04) [D]
- **ex-05 · trace-a-siem-flow** — each stage is a function; print the count entering each — verify. (co-05) [D]
- **ex-06 · prepare-bulk-data** — produce bulk-format NDJSON text in memory (the optional import snippet is prose
  and an illustration) — verify the first two lines. (co-05)
- **ex-07 · read-a-timeline** — group events by minute to see a recon pattern — verify the table. (co-05)
- **ex-08 · normalize-two-log-shapes** — map a web shape and an auth shape to one schema — verify both outputs.
  (co-06) [D]
- **ex-09 · signature-detection** — match a known bad string — verify the hit. (co-07)
- **ex-10 · signature-vs-anomaly** — a fixed rule and a baseline over the same counts — verify what each flags.
  (co-08) [D]
- **ex-11 · read-a-network-rule-shape** — parse the header and options of a network rule — verify the parts.
  (co-09)
- **ex-12 · endpoint-telemetry-fields** — parse a process-creation event — verify. (co-13)
- **ex-13 · extend-an-endpoint-view** — add parent and child links — verify the process tree. (co-13) [D]
- **ex-14 · treat-detections-as-code** — a rule as a function with a test table — verify the tests pass. (co-10)
  [D]
- **ex-15 · write-a-failed-login-sigma-rule** — a YAML rule and a small evaluator — verify the matching events.
  (co-10, co-11)
- **ex-16 · inspect-sigma-structure** — read `logsource`, `detection`, and `condition` from a rule — verify the
  parts. (co-11) [D]
- **ex-17 · keep-sigma-portable** — the same rule on two field schemas through a mapping — verify equal matches.
  (co-12)
- **ex-18 · tactic-vs-technique** — a two-level map and a lookup — verify. (co-15)
- **ex-19 · the-enterprise-tactic-set** — load the versioned tactic list — verify 15 tactics and that the file
  states its version. (co-15) [D]
- **ex-20 · map-a-detection-to-attck** — read `tags` from a rule and resolve them — verify. (co-15)
- **ex-21 · ioc-types** — classify indicators as hash, domain, address, or file name — verify. (co-16)
- **ex-22 · match-an-ioc** — match indicators against the event stream — verify the hits. (co-16)
- **ex-23 · ingest-an-intel-list** — read a list, reject malformed rows and any address outside the reserved
  ranges — verify the rejected rows. (co-16) [D]
- **ex-24 · ttp-vs-atomic-ioc** — change one attacker detail and see which detections break — verify. (co-17)
- **ex-25 · map-work-to-csf-functions** — assign activities to the six functions — verify the table. (co-18) [D]
- **ex-26 · place-govern-around-the-work** — Govern as the outer function — verify. (co-18)

### Intermediate (`learning/intermediate.md`, Examples 27–52)

- **ex-27 · detect-a-suspicious-request-pattern** — a rule over web events for a traversal-style path — verify the
  hits. (co-19) [D]
- **ex-28 · test-a-rule-against-benign-traffic** — verify zero hits on benign events. (co-19)
- **ex-29 · rate-alert-severity** — severity from a rule's weight and the asset's criticality, five levels —
  verify a table of rule and asset pairs. (co-19) [D]
- **ex-30 · the-false-positive-trade-off** — precision and recall over a labelled fixture — verify the numbers.
  (co-19) [D]
- **ex-31 · tune-a-failed-login-threshold** — sweep a threshold and pick one with the trade-off printed — verify.
  (co-19) [D]
- **ex-32 · detect-a-failed-login-burst** — a sliding window — verify the burst. (co-19)
- **ex-33 · order-the-pyramid-of-pain** — rank indicator types by the cost to change — verify the order. (co-17)
  [D]
- **ex-34 · prefer-durable-behavioral-evidence** — a hash rule breaks on a rename, a behavior rule does not —
  verify both. (co-17)
- **ex-35 · write-a-hunt-hypothesis** — a structured hypothesis record, validated — verify. (co-20)
- **ex-36 · run-a-hypothesis-driven-hunt** — run queries and record the outcome — verify. (co-20) [D]
- **ex-37 · pivot-from-one-ioc** — expand from one indicator to related events — verify. (co-20)
- **ex-38 · a-safe-yara-shape** — parse the strings and condition of a rule — verify. (co-21)
- **ex-39 · read-yara-strings-and-condition** — evaluate a condition over inert synthetic bytes — verify. (co-21)
- **ex-40 · static-sample-review** — hash, length, and printable strings of an inert invented sample — verify.
  (co-21)
- **ex-41 · describe-sandboxed-dynamic-review** — a checklist state machine; nothing is executed — verify. (co-21)
- **ex-42 · map-an-ir-lifecycle** — the NIST Rev. 3 framing against the older stage model — verify the mapping.
  (co-22) [D]
- **ex-43 · prepare-an-incident-playbook** — a playbook as data with preconditions — verify. (co-22)
- **ex-44 · scope-an-incident-from-telemetry** — find affected hosts and accounts — verify. (co-23) [D]
- **ex-45 · precursors-vs-indicators** — classify events — verify. (co-23)
- **ex-46 · contain-a-lab-incident** — containment as ordered steps; an out-of-order step is refused — verify the
  refusal. (co-24) [D]
- **ex-47 · eradicate-a-lab-foothold** — a checklist with verification — verify. (co-24)
- **ex-48 · recover-a-lab-service** — recovery ordering — verify. (co-24)
- **ex-49 · preserve-an-evidence-record** — hash artifacts and keep a custody log — verify the log. (co-23) [D]
- **ex-50 · write-a-blameless-note** — a post-incident note validated for required fields — verify. (co-25)
- **ex-51 · apply-zero-trust-tenets** — a policy function that denies by default — verify allow and deny cases.
  (co-26) [D]
- **ex-52 · policy-decision-vs-enforcement** — a decision point and an enforcement point as separate functions
  — verify. (co-26) [D]

### Advanced (`learning/advanced.md`, Examples 53–78)

- **ex-53 · segment-a-training-network** — a segmentation matrix and reachable pairs — verify. (co-27) [D]
- **ex-54 · review-a-deny-by-default-firewall** — evaluate a rule list with a default deny — verify. (co-27)
- **ex-55 · apply-a-baseline-control** — check a configuration against an original control — verify pass and fail.
  (co-28)
- **ex-56 · reduce-an-attack-surface** — compare needed and open services — verify the difference. (co-28) [D]
- **ex-57 · inventory-lab-findings** — a list of invented findings with owners — verify. (co-29)
- **ex-58 · run-a-patch-management-loop** — a state machine from found to verified — verify. (co-29) [D]
- **ex-59 · prioritize-remediation** — order by severity and exposure — verify. (co-29)
- **ex-60 · design-a-safe-decoy** — a decoy record nothing legitimate touches — verify. (co-30)
- **ex-61 · alert-on-decoy-interaction** — any touch raises an alert — verify. (co-30) [D]
- **ex-62 · a-response-gate** — an approval gate that refuses an unapproved destructive step — verify the
  refusal. (co-31) [D]
- **ex-63 · enrich-an-alert** — add owner and indicator context before action — verify. (co-31)
- **ex-64 · recognize-alert-fatigue** — alert volume against analyst capacity — verify the backlog numbers. (co-32)
  [D]
- **ex-65 · tune-a-noisy-signal** — an allow-list entry that carries an expiry — verify it lapses. (co-32)
- **ex-66 · close-a-purple-team-loop** — expected telemetry against observed — verify the gaps. (co-33) [D]
- **ex-67 · find-a-coverage-gap** — techniques with no rule — verify the list. (co-33)
- **ex-68 · build-a-coverage-matrix** — rules against techniques — verify the counts. (co-33) [D]
- **ex-69 · place-an-ids** — what a sensor sees from each position — verify. (co-14) [D]
- **ex-70 · correlate-two-local-sources** — join authentication and endpoint events by user and window — verify.
  (co-34) [D]
- **ex-71 · build-an-attack-timeline** — an ordered view of one incident — verify. (co-34)
- **ex-72 · gate-detection-changes-in-ci** — a rule test suite fails when a benign event matches — verify the
  failing case. (co-34) [D]
- **ex-73 · translate-a-sigma-rule** — a query string for the lab store, listing what the translation drops —
  verify. (co-12)
- **ex-74 · sweep-for-an-ioc** — search history for one indicator — verify. (co-20)
- **ex-75 · promote-a-hunt-to-a-detection** — turn a hunt into a rule with a test — verify. (co-20, co-10) [D]
- **ex-76 · run-an-incident-tabletop** — a state machine that walks an incident and refuses out-of-order steps —
  verify the transcript. (co-22) [D]
- **ex-77 · verify-a-clean-restore** — compare checksums before and after — verify. (co-24)
- **ex-78 · complete-the-blue-team-capstone** — run the capstone and read its report — verify. (co-01–co-34)

## Capstone-handoff examples (do not move)

Three plan 08 capstones rely on four concepts taught here ([tech-docs/005](../../tech-docs/005-security-content-and-accuracy.md#capstone-handoff)).
These example numbers are the contract; if a maker moves one, the brief, tech-docs/005, and the capstone rows
change together.

| Concept        | Examples | What the capstones need                                                               |
| -------------- | -------- | ------------------------------------------------------------------------------------- |
| Log source     | 2, 3, 8  | What a source is, why one is chosen, how two shapes normalize                         |
| Detection rule | 14–17    | A rule as code, a Sigma rule's `logsource`, `detection`, and `condition`, portability |
| Severity       | 29       | Alert severity levels as a function of rule weight and asset criticality              |

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-regex-matches-too-much`, `kata-02-rule-misses-case-variation`,
  `kata-03-threshold-never-fires`, `kata-04-allow-list-never-expires`, `kata-05-containment-before-scoping`,
  `kata-06-evidence-modified-before-hashing`, `kata-07-policy-default-allows`, `kata-08-coverage-counts-disabled-rule`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6 (for example, why tune a
  threshold before suppressing a rule, and why a tabletop refuses steps out of order).

## Capstone spec

**A blue-team pipeline.** `capstone/code/` holds a program that reads a synthetic event stream, normalizes it,
runs four rules (one signature, one baseline, one Sigma-shaped, one decoy), rates the severity of each alert,
builds an incident timeline, walks a containment and recovery plan with the gate from ex-62, and prints an ATT&CK
coverage matrix. The folded-in incident report (today's side page `ir-report.md`) is the capstone's closing
section. The capstone carries its own copy of any fixture and of `labkit.py`.

## Code and harness

- Toolchain `python` (3.14.8) with `requirements.lock` for PyYAML (generated with hashes by `uv pip compile
--generate-hashes`; probe P11). Each unit is `ex-NN-<slug>/main.py` with an expected stdout file.
- No network client, no host argument, no environment-supplied target. Times come from the fixtures. Output
  sorts every collection it prints. SEC1 (reserved addresses only) holds for every page and file.
- The old flat `blue_lab.py` and `check-lab.sh` are deleted, and the old `failed-login-burst.yml` is replaced by
  rule files next to the units that use them; the useful parts are rewritten as per-example units. The course
  title today carries a `60 ·` prefix, which is a series matter (plan 01), not this plan's.

## Lineage

- Replaces the templated course measured on 2026-10-09 (12,255 words, 4 code files). Topic lineage: the
  `defensive-security` brief of the 2026-07-19 fundamentally-strong plan, and the 2026-08-15 security-and-ops
  authoring plan that wrote the templated course. The course overview names
  `detection-engineering-and-siem-operations` as the course that follows.
- The `## Legacy relation` section of the course `overview.md` ("Superseded by: ...") is unchanged: plan 10 reads
  it.

## In which paths

- `careers/fundamentally-strong/software-engineer`, `careers/immediately-effective/software-engineer`, and
  `careers/interview-ready/software-engineer` — extension phase `security`. Three plan 08 capstones list the
  course in `relies-on`: `capstone-secure-service`, `capstone-real-world-delivery`, and
  `capstone-build-your-own-pentest-engine`. No manifest change.
