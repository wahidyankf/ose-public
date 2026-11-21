---
description: "Language-neutral testing standards that every adopted stack standard links instead of restating"
when_to_use: "Use to locate a shared testing standard before writing or reviewing tests or a coverage gate."
---

# Testing Standards

- [Meaningful Coverage](./meaningful-coverage.md) — Numeric coverage limited to authored executable production code;
  generated, declarative, vendored, end-to-end, and infrastructure code carry no line target. Use when setting, reading,
  or reviewing a coverage gate. The floor itself is recorded in the
  [Repository Adapter](../stacks/repository-adapter/adopter-decisions.md).
- [Test Doubles](./test-doubles.md) — Selects the test double for each collaborator: in-memory fakes over mocks for owned
  ports, stubs for external services, spies only where the interaction is the behaviour. Use when a test needs to replace
  a collaborator, or when reviewing a test that mocks, stubs, or spies on something.
