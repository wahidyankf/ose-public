# Plan Domain

Gherkin specs for `rhino-cli plan validate`, the structural plan validator that must report exactly
what the pinned RHINO validator reports for the same tree.

| File                     | Command(s)      | Scenarios |
| ------------------------ | --------------- | --------- |
| `plan-structure.feature` | `plan validate` | 6         |

The corpus scenarios read the shared plan-structure corpus in
[`specs/fixtures/plan-structure/`](../../../../../fixtures/plan-structure/README.md), which is
byte-identical with the `ose-rules` catalog and verified against its digest before any case runs.

## Related

- **Parent**: [rhino-cli Gherkin specs](../README.md)
