# Gate Gherkin Specs

Gherkin feature files for the registry-driven `rhino-cli gate` command family.

## Feature Files

| File                       | Command(s)                                      | Purpose                                                    |
| -------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `gate-declaration.feature` | `repo-config validate` / `gate list`            | Registry schema and declaration rules                      |
| `gate-emission.feature`    | `gate emit`                                     | Generated `lint-staged` projection                         |
| `gate-enumeration.feature` | `gate list`                                     | Surface projections and CI matrix rows                     |
| `gate-execution.feature`   | `gate run`                                      | Gate dispatch and derived inputs                           |
| `gate-validation.feature`  | `gate validate`                                 | Registry-to-surface conformance                            |
| `parity-manifest.feature`  | `parity manifest`                               | Hermetic byte-identity checksum guard                      |
| `rust-delegation.feature`  | the validators RHINO provides / `gate validate` | Hand-off to the pinned `./rhino` and the F# keep-list rows |

## Related

- **Parent**: [rhino-cli Gherkin specs](../README.md)
- **Command reference**: [rhino-cli](../../../../../../apps/rhino-cli/README.md)
