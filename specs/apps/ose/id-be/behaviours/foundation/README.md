# foundation — OSE ID BE Gherkin Domain

Scenarios for the inert backend platform: how the local stack is started and torn down, what its two
health endpoints mean, how database privilege is split, which runtime modes may serve, whether two
instances are interchangeable, how a switched-off identity capability answers, and what a request
learns about a route it addressed with a method that route does not answer.

## Feature Files

- **[local-stack.feature](./local-stack.feature)** — Ordered local startup and complete teardown (1 scenario)
- **[health.feature](./health.feature)** — Liveness stays truthful when readiness fails (1 scenario)
- **[database-privilege.feature](./database-privilege.feature)** — The serving role cannot change schema (1 scenario)
- **[runtime-mode.feature](./runtime-mode.feature)** — Unsupported backend runtime modes fail closed (1 scenario outline)
- **[stateless-instances.feature](./stateless-instances.feature)** — Correctness survives without instance affinity (1 scenario)
- **[disabled-capabilities.feature](./disabled-capabilities.feature)** — Disabled identity capabilities answer as absent (1 scenario outline)
- **[route-disclosure.feature](./route-disclosure.feature)** — An unanswered method answers as an unregistered path (1 scenario outline)

## Related

- [Parent gherkin README](../README.md)
