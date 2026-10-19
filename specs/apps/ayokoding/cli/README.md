# AyoKoding CLI Behaviours

Behaviour specifications for `ayokoding-cli`. The corpus lives under
`behaviours/`; each adapter binds every scenario:

- unit: in-process, with `fstest.MapFS` and a fake runtime;
- integration: an in-process command against temp dirs, the fake container CLI, and real git;
- e2e: the built binary and real Docker.

Scenarios carry `@e2e-exempt` only with an exemption comment naming the
integration proof, per the repository behaviour-coverage rule.
