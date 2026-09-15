# Business Requirements — islamic-be-init

## Business Goal

Establish a dedicated, independently deployable API surface for generic Islamic tooling, and prove
it end to end with a single health endpoint before any domain logic is written.

The platform's existing backends serve organisation-facing products: `ose-be` answers compliance
gap-analysis questions about a firm's policies, and `organiclever-be` backs a personal productivity
journal. Neither is a natural home for utilities that any Muslim developer, product, or device might
call — prayer times for a coordinate and date, qibla bearing, hijri/gregorian conversion, and the
calculation-method metadata behind them. Those are computation, not compliance.

## Rationale

Three properties separate this workload from everything already deployed here:

- **Stateless and cacheable.** Prayer times are a pure function of latitude, longitude, date,
  calculation method, and madhab. The service owns no database, no message bus, and no user
  identity. `ose-be` owns all three.
- **Different consumers.** Compliance answers are consumed by an authenticated web client inside one
  organisation. Islamic tools are consumed broadly and anonymously, with a request profile closer to
  a CDN than to an application backend.
- **Different release cadence.** Folding this into `ose-be` couples a high-churn utility surface to
  the release rhythm of a regulated compliance product, and inflates that product's blast radius for
  every unrelated change.

A secondary, deliberate benefit: this delivery makes Go a first-class language in the monorepo. That
capability was partially built for a demo backend and then orphaned when the demo was deleted. This
plan finishes it against a real product rather than a throwaway one.

It also **collects a dividend already paid for**. The parallel [`lms-init`](../../in-progress/lms-init/README.md)
plan refactors the `rhino-cli` doctor tool inventory to be config-driven, arguing that the cost is
justified because it removes the two-repository parity charge from every _future_ language. This
plan is that future language, and it is the first to test the claim: registering Go with the doctor
should cost one `repo-config.yml` list item and zero `rhino-cli` edits. Phase 1 verifies exactly
that and records the result.

## Business Impact

| Area                   | Impact                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| Product surface        | A fourth product domain (`islamic`) alongside `ose`, `organiclever`, and `ayokoding`.                          |
| Engineering capability | Go joins TypeScript, F#, and Dart as a gated language with CI, linting, coverage, and BDD binding support.     |
| Platform risk          | One more deployable to operate; offset by the service owning no persistent state and no external credentials.  |
| Reversibility          | High. No data is persisted, no client depends on it yet, and deletion is a folder removal plus registry edits. |

## Affected Roles

- **Platform engineers** — gain a Go lane; carry the cost of maintaining a fourth language toolchain
  in CI and in `rhino-cli`.
- **Product engineers** — gain a place to build Islamic tooling without negotiating space in the
  compliance backend.
- **Reviewers** — see Go diffs for the first time; DU1 lands the linting and coverage gates that make
  those diffs reviewable.
- **Whoever executes `lms-init`** — inherits a downstream consumer. Their DU1 and DU2 now gate a
  second plan, which raises the cost of abandoning or reshaping either unit.

## Success Metrics

| Metric                   | Target                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Health endpoint liveness | `GET /api/v1/health` returns 200 with `{"status":"healthy"}` in the E2E suite.                                                                   |
| Unit line coverage       | At least 99% over the production denominator, enforced by `islamic-be:test:unit`.                                                                |
| Gherkin binding coverage | Every active scenario bound at Unit and E2E; zero unexplained `allowedUnbound`.                                                                  |
| CI correctness           | Go targets execute only in the `go` job; the `typescript`, `dotnet`, and `flutter` jobs all skip them.                                           |
| Cross-repo parity        | `apps/rhino-cli/src` **and** `parity-manifest.sha256` byte-identical between `ose-public` and the private sibling, with the nightly audit green. |
| Doctor dividend          | Registering Go costs one `repo-config.yml` list item and zero `rhino-cli` edits, validating `lms-init` D-4's rationale.                          |

## Business-Scope Non-Goals

- Shipping any Islamic-tool endpoint. Prayer times, qibla, and hijri conversion are the product
  rationale for a separate service, not this delivery's content.
- Public availability. No domain, no TLS termination, no rate limiting, no GHCR image, no staging
  branch. The service runs on a developer machine and in CI only.
- Authentication, authorisation, quotas, or any notion of a caller identity.
- Calculation-method research. Which conventions to support, and their scholarly basis, is a
  separate product question that must be answered before endpoints are designed.

## Business Risks and Mitigations

| Risk                                                                                                     | Likelihood | Mitigation                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Go lane is built and then a second Go service never follows, leaving it orphaned.                    | Medium     | The lane is justified by this service alone; every component is exercised by `islamic-be` in the same plan.                                                                                                     |
| Islamic-tool endpoints never get built, leaving a service that only reports its health.                  | Medium     | Deletion is cheap and explicitly documented as the rollback. No client, no data, no deploy target to unwind.                                                                                                    |
| Religious-calculation correctness becomes a reputational risk once endpoints land.                       | Low (here) | Out of scope by construction; `prd.md` records it as a Non-Goal so no endpoint ships without its own correctness plan.                                                                                          |
| `rhino-cli` parity drifts between repositories during the paired change.                                 | Medium     | Cross-Repository Parity Identity is recorded before the first mutation; the parity audit workflow gates convergence.                                                                                            |
| This plan is blocked while [`lms-init`](../../in-progress/lms-init/README.md) DU1 and DU2 execute.       | High       | Accepted deliberately: the alternative duplicates six shared surfaces and races two parity PR pairs on one generated manifest. Phase 0 verifies the upstream state and stops rather than substituting the work. |
| Two language lanes land close together and a reviewer cannot tell which plan owns a shared-surface line. | Low        | Each plan names the other in its README and decision records; `islamic-be-init` D-0 tabulates every overlapping file and states who lands it first.                                                             |

## See Also

- [prd.md](./prd.md) — product scope and acceptance criteria.
- [tech-docs.md](./tech-docs.md) — architecture and decision records.
