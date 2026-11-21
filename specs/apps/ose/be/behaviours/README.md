# OSE Application BE — Gherkin Scenarios

Backend (HTTP-semantic) Gherkin scenarios for `ose-be`. Consumed by xUnit + TickSpec.

## Feature files

| Feature file                                                                     | Domain            |
| -------------------------------------------------------------------------------- | ----------------- |
| [health/health.feature](./health/health.feature)                                 | health            |
| [regulatory-source/](./regulatory-source/)                                       | regulatory-source |
| [internal-policy/](./internal-policy/)                                           | internal-policy   |
| [gap-analysis/](./gap-analysis/)                                                 | gap-analysis      |
| [ai-orchestration/](./ai-orchestration/)                                         | ai-orchestration  |
| [db/migrations.feature](./db/migrations.feature)                                 | db                |
| [messaging/nats-config.feature](./messaging/nats-config.feature)                 | messaging         |
| [messaging/live/nats-connect.feature](./messaging/live/nats-connect.feature)     | messaging         |
| [messaging/live/jetstream-demo.feature](./messaging/live/jetstream-demo.feature) | messaging         |

- [ai-orchestration](./ai-orchestration/README.md) — ose-be Gherkin Domain
- [db](./db/README.md) — ose-be Gherkin Domain
- [gap-analysis](./gap-analysis/README.md) — ose-be Gherkin Domain
- [health](./health/README.md) — ose-be Gherkin Domain
- [internal-policy](./internal-policy/README.md) — ose-be Gherkin Domain
- [messaging](./messaging/README.md) — ose-be Gherkin Domain
- [regulatory-source](./regulatory-source/README.md) — ose-be Gherkin Domain
