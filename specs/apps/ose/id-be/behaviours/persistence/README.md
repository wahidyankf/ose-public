# persistence — OSE ID BE Gherkin Domain

Scenarios for what stored OSE ID rows must keep about themselves: the audit envelope every table
carries, and the refusal to physically remove a record rather than mark it inactive.

## Feature Files

- **[database-audit-and-soft-delete.feature](./database-audit-and-soft-delete.feature)** — Stored history stays attributable and cannot be physically deleted (1 scenario)

## Related

- [Parent gherkin README](../README.md)
