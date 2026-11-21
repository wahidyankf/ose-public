---
description: "Canonical names and applicability for build, static coverage, and runtime testing targets"
when_to_use: "Use before adding or renaming an Nx lifecycle target."
---

# Target Naming Standards — Canonical Lifecycle Targets

| Target                    | Purpose                                                                                  | Required when                                            |
| ------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `build`                   | Produce a deployable/runnable artifact                                                   | Project compiles or bundles                              |
| `typecheck`               | Verify types without distributable output                                                | A distinct type-analysis pass exists                     |
| `lint`                    | Run static analysis and style checks                                                     | Every project                                            |
| `test:unit`               | Execute isolated Unit tests                                                              | Every behaviour owner                                    |
| `test:integration`        | Execute local-resource Integration tests                                                 | Project owns that boundary                               |
| `test:e2e`                | Execute public-boundary E2E tests                                                        | Dedicated E2E project or executable public-process owner |
| `test:coverage:<layer>`   | Statically validate scenario-to-adapter coverage                                         | Corresponding adapter applies                            |
| `test:behaviour:coverage` | Run RHINO's shared static corpus, binding, and exemption check (no test)                 | Every owner and dedicated E2E project                    |
| `test:coverage`           | Aggregate every applicable per-layer static coverage validator                           | More than one coverage validator applies                 |
| `test:quick`              | Run fast static gates, Unit runtime where applicable, and all applicable static coverage | Every project                                            |

See [E2E and utility targets](./target-naming-canonical-names-e2e-and-utility.md) for interactive and
operational variants. Do not introduce aliases or inapplicable placeholders.
