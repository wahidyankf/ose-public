# Business Requirements — OSE LMS Backend Initialization

## Business Goal

Open Sharia Enterprise intends to offer Sharia-compliant learning delivery alongside its existing
compliance gap-analysis product. That product needs a backend service before it can need anything
else. This plan creates that service as an empty but fully governed shell: it builds, it is
formatted, it is linted, it is behaviour-tested, it is gated in CI, and it answers a health probe.
No learning feature is delivered.

The value is not the two endpoints. The value is that the **next** piece of LMS work starts from a
project the repository already knows how to build and block on, instead of starting from a language
the repository has never compiled.

## Why Now

Three reasons, in order of weight:

1. **Language enablement is the expensive part, and it is front-loaded either way.** Whether the
   first Java delivery is a hello-world or a full enrolment API, the same five shared surfaces must
   learn Java first. Paying that cost against a two-endpoint service means the risk lands on a diff
   nobody depends on, rather than on a diff that also carries domain logic.
2. **The cost is measurable now and grows later.** The behaviour-coverage validator, the CI gate,
   the formatter registry, and the doctor inventory are all small today. Each grows as more projects
   register against them, and each becomes harder to change once a Java project already depends on
   it.
3. **The doctor refactor unblocks the language after this one.** Making the tool inventory
   config-driven is a one-time two-repository change. Once landed, the next language to arrive needs
   a `repo-config.yml` entry rather than a private-sibling parity delivery.

## Affected Roles

| Role                       | What changes for them                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Platform maintainer        | Gains a fourth active language to keep current: JDK, Gradle, Spring Boot, and the Java formatter now need dependency attention |
| Contributor (any language) | `npm run doctor` begins checking for a JDK; the pre-commit formatter begins covering `.java`; PR CI gains a Java job           |
| LMS feature author         | Has a buildable, gated project to add endpoints to, and a Gherkin corpus already wired to Unit and E2E adapters                |
| Operator                   | Gains a second backend health surface to probe, on the same contract shape `ose-be` already publishes                          |

## Business-Level Success Measures

These are observable checks, not estimates. Each is verifiable by running a named command.

- A fresh clone with no JDK installed reports the missing tool through `npm run doctor` rather than
  failing later with a build error.
- `nx affected -t test:quick` reaches Java projects and enforces the same 99% line-coverage floor
  every other owner project carries.
- A `.java` file committed with wrong formatting is corrected by the pre-commit hook, and an
  unformatted `.java` file reaching CI fails the `formatting-verify` group.
- The nightly `rhino-cli-parity-audit` workflow stays green across both repositories throughout and
  after delivery.
- A Gherkin scenario added to the LMS corpus with no Java step definition fails
  `ose-lms-be:test:coverage:behaviour` — proving the validator genuinely reads `.java` bindings.

## Business Non-Goals

Stated as exclusions so a reader does not infer them from the presence of a backend:

- **No LMS product capability.** No courses, enrolments, lessons, assessments, progress tracking,
  certificates, or learner identity. The service knows nothing about learning.
- **No revenue or user-facing surface.** There is no LMS client, no domain, no public URL, and no
  entry in the marketing site. Nothing ships to a user.
- **No deployment.** No Dockerfile, no Kubernetes manifest, no staging or production branch, no
  build-and-deploy workflow. The service runs locally and in CI only.
- **No migration of existing backends.** `ose-be` and `organiclever-be` stay on F#/Giraffe. This
  plan does not begin, imply, or prepare a port.
- **No commitment to Java beyond this service.** Enabling the language does not make it the default
  for future backends; the language-selection guidance stays as written.

## Business Risks

| Risk                                                                                                         | Consequence if it lands                                                                       | How this plan reduces it                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Stack fragmentation.** A second backend stack doubles the toolchain the maintainer must keep current       | Security patching, dependency bumps, and CI maintenance roughly double for backend work       | Recorded as an accepted cost in `tech-docs.md` with the rejected alternatives; scope held to one service with no deployment surface       |
| **Two-repository drift.** The `rhino-cli` change lands unevenly across `ose-public` and the private sibling  | The nightly parity audit goes red and stays red, eroding trust in a signal meant to be silent | The parity change is its own delivery unit, landed in both repositories before anything depends on it, with the manifest regenerated      |
| **Governance tail underestimated.** Java enablement turns out larger than the service it enables             | The plan stalls mid-way with a half-enabled language and a project that cannot be gated       | Enablement is delivered before the service, so a stall leaves a coherent `main` with no orphaned Java project                             |
| **Shell rots unused.** The LMS never receives domain work and the service becomes maintenance with no return | Ongoing dependency and CI cost for a permanently empty service                                | Deliberately minimal: no persistence, no deployment, no infrastructure to maintain — deleting it later removes four projects and no data  |
| **Version currency.** Java 25, Spring Boot 4.1, and Gradle 9.7 all move during and after delivery            | Pinned versions go stale and the "current LTS" claim stops being true                         | Every version is pinned in a named file with the resolution command recorded, and re-resolved at Phase 0 rather than trusted from writing |

## Related

- [`prd.md`](./prd.md) — the product scope and acceptance criteria these goals resolve to
- [`tech-docs.md`](./tech-docs.md) — the design decisions and their rejected alternatives
- [Resource-Aware Development](../../../repo-governance/development/practice/resource-aware-development.md)
  — the compute-coordination contract every command in this plan runs under
