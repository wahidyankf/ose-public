---
description: "Applicability and runtime contract for local-resource Integration targets"
when_to_use: "Use when implementing or reviewing test:integration."
---

# Projects with Integration Tests

Expose `test:integration` only when a project owns a real local-resource boundary. Integration may
use isolated files, local databases, environment state, child processes, and standard streams.
Setup, assertions, isolation, and cleanup are part of this boundary.

## The loopback boundary

Ownership sets the layer, not transport. Integration may bind and drive a loopback socket the test
owns end to end: a server the test starts, on a port it controls, and shuts down before it
finishes. It must never reach an external network, a host or service it did not start, or a routed
public origin. Network permission alone still does not make a test E2E — E2E is defined by
observing the public boundary.

Loopback is denied by default and is not a licence a project grants itself. A project that needs it
gives its reason in the change that introduces the socket, and review accepts or refuses it. Every
project without that acceptance keeps network-free Integration as a product invariant. The layer
permits loopback; the repository still decides who holds it.

**Enforcement**: unenforced by decision; checked by review. No declared gate or pinned RHINO command
scans a project's `tests/integration/` sources for network constructs, and `repo-config.yml` declares
no loopback allowlist, because whether a socket is test-owned and whether the project may hold it is a
judgement no mechanical check settles. `swe-reviewer`'s test-design check judges each test against its
layer, and `test:coverage:integration` proves only scenario coverage, never what a test touches.

## Target contract

The target runs only Integration tests. `test:coverage:integration` statically proves that each
applicable Gherkin scenario has exactly one Integration implementation or valid exemption; it does
not execute the suite. During development/review, select impacted scenarios manually. Scheduled
full-quality CI runs the complete suite before E2E.

Projects without this boundary omit both targets and explain why in their README. In-process mocks
belong to Unit; public HTTP/UI journeys belong to E2E.
