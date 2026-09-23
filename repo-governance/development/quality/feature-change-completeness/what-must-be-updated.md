---
description: "The full list of artifact types (specs, contracts, tests, docs) a feature change must keep in sync."
when_to_use: "Use when unsure which companion artifact a feature change must also update."
---

# What Must Be Updated

## 1. Specs (Gherkin Feature Files)

**Location**: `specs/apps/<product>/<owner>/behaviours/` and `specs/libs/<library>/behaviours/` — the [logical owner corpus](../../../conventions/structure/specs-directory-structure/logical-owner-corpus.md) is the only shape

**Update when:**

- Adding a new endpoint, procedure, command, or user-facing behaviour -- add scenarios
- Modifying request/response shapes, validation rules, or error handling -- update scenarios
- Removing an endpoint, procedure, or command -- remove or archive scenarios
- Changing authentication or authorization requirements -- update scenarios

**Automated enforcement**: each owner's project-local `test:coverage:*` targets catch missing,
duplicate, or unused scenario bindings and invalid exemptions. Nx cache inputs include Gherkin specs
so stale specs invalidate test and static-validation caches.

## 2. Contracts (OpenAPI Specs)

**Location**: `specs/apps/<product>/<owner>/contracts/`, inside the owner that serves the contract

**Update when:**

- Adding a new REST endpoint -- add path and schema definitions
- Changing request or response shapes -- update schema definitions
- Adding or removing query parameters, headers, or authentication schemes
- Changing status codes or error response formats
- Deprecating or removing an endpoint

**Automated enforcement**: `codegen` targets generate types from contracts. Stale contracts cause `typecheck` to fail because generated types do not match the implementation.

## 3. Tests

**Update when:**

- **Unit tests**: Every active scenario requires substantive in-process Unit proof. Unit has no
  exemption, and runtime line coverage must meet the repository's 99% floor.
- **Integration tests**: Local deterministic resource boundaries such as filesystems, databases,
  queues, and subprocesses require Integration proof with no external network reach.
- **E2E tests**: Public browser, HTTP, API, or executable-process boundaries require E2E proof with
  isolated synthetic data and no production identity or production data.
- **Accessibility tests**: UI changes require accessibility verification (static analysis via oxlint jsx-a11y plugin, manual WCAG AA checks).

**Automated enforcement**: `test:unit` in `test:quick` enforces numeric coverage. Static
`test:coverage:*` targets in the same quick gate enforce exact scenario-to-adapter coverage without
running tests. Integration and E2E runtime never run in hooks or PR CI.

## 4. Documentation

**Update when:**

- Adding a new feature that users or developers need to know about
- Changing API behaviour that is documented in READMEs or docs/
- Adding or removing configuration options
- Changing architectural boundaries (C4 diagrams in specs/)
- Adding or removing dependencies that affect setup instructions

**Manual enforcement**: Documentation updates require human judgment about what is relevant. Run
[Docs Propagation](../../../workflows/docs/docs-propagation.md), which finds every document that
references the changed feature and updates or removes it in the same commit.
