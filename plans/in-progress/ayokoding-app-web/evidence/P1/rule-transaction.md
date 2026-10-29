# P1 rule transaction — frozen inputs (`ose-public` only)

Revision: `af40b276d`. No obligation is recorded for BeaverNest or any sibling.

| Input (005 row)                                                                                                        | Scope                                          | User decision                                         | Follow/violate condition                                         | Affected files                                                                                               | Disposition                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Go stdlib + htmx instead of F# new-backend default; `go test`, godog, golangci-lint, nilaway, browser-helper TS checks | `apps/ayokoding-web`, `apps/ayokoding-web-e2e` | stdlib over framework, godog over vendored engine     | violated if a framework dep or Elixir toolchain appears          | `apps/ayokoding-web/**`, `repo-config.yml` stacks                                                            | gated: `ayokoding-web:test:quick`, Go lane                                                  |
| `ayokoding-data` language-neutral shared-data package                                                                  | `libs/ayokoding-data`                          | JSON + provenance + vectors, TS adapters keep exports | violated if product runtime logic enters the JSON lib            | `libs/ayokoding-data/**`, `repo-governance/.../adopter-decisions.md`, `docs/reference/monorepo-structure.md` | named naming exception recorded in both homes; `stacks: [typescript]` is a closed-set value |
| Native Go BDD bindings: expanded identities + 99% Unit floor                                                           | `apps/ayokoding-web/tests/bdd`                 | godog following ayokoding-cli                         | violated if a scenario is unowned or floor drops                 | `behaviour-coverage.json`, `tests/bdd/**`                                                                    | gated: `behaviour-coverage.mjs` + coverage-gate script                                      |
| Listener 3102 / test 3191, prefixed-env precedence                                                                     | local ports                                    | keep 3102/3191, `AYOKODING_WEB_PORT`                  | violated if a bare `PORT` is honoured or a stock port is claimed | `docs/reference/web-sites.md`, `cmd/ayokoding-web`                                                           | review disposition + unit config + coexistence tests                                        |
| Pinned module deps, no vendored engine                                                                                 | `apps/ayokoding-web/go.mod`                    | godog/goldmark/bluemonday/yaml pins                   | violated if a vendored copy lands in `libs/`                     | `go.mod`/`go.sum`                                                                                            | licensing policy; pin review                                                                |

Scan result: no rule surface conflicts with the Go selection. Existing sufficient rules reused
unchanged: BDD/coverage enforcement, `lang:go` lane + `setup-go` action (already exist; projects
only register the tag), licensing policy. No BeaverNest governance copied.

Enforcement map: `ayokoding-web:test:quick` (typecheck/lint/unit/static), `test:integration`,
`test:coverage:behaviour`; docs edits verified by Docs Propagation (same unit); validators
(`test:validators`, incl. workflow-language-lanes which derives tags from `apps/**/project.json`

- `libs/**/project.json` via git grep — new `lang:go`/`lang:ts` projects are automatically covered,
  no test change required).
