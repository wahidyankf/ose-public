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
declares itself in the `integration-loopback:` allowlist of `repo-config.yml` with a reason. Every
project outside that list keeps network-free Integration as a product invariant. The layer permits
loopback; the repository still decides who holds it.

**Enforcement**: the `test-boundary` gate (`./rhino governance test-boundary validate`,
ci-group `governance`) scans each project's `tests/integration/` sources for network-API constructs
and fails an unallowlisted use. It also fails an allowlist entry that names an unknown project or
carries no reason, and warns on an entry no longer backed by any network use.

## Target contract

The target runs only Integration tests. `test:coverage:integration` statically proves that each
applicable Gherkin scenario has exactly one Integration implementation or valid exemption; it does
not execute the suite. During development/review, select impacted scenarios manually. Scheduled
full-quality CI runs the complete suite before E2E.

Projects without this boundary omit both targets and explain why in their README. In-process mocks
belong to Unit; public HTTP/UI journeys belong to E2E.
