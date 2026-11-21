---
description: "Real targets required by project capability instead of a mandatory placeholder set"
when_to_use: "Use when scaffolding or reviewing project.json targets."
---

# Mandatory and Applicable Nx Targets

Every registered project exposes real `lint` and `test:quick` targets. Add `typecheck`, `build`,
`dev`, `start`, or code-generation targets only when the project capability requires them.

Every behaviour owner exposes real `test:unit`, `test:coverage:unit`, and
`test:behaviour:coverage` targets. Add Integration and E2E runtime/static coverage pairs only when
the project's real boundary makes that adapter applicable. Dedicated E2E projects expose
`test:e2e`, `test:coverage:e2e`, and `test:behaviour:coverage` for their owner's corpus; they do not
invent Unit or Integration targets.

An owner's `test:unit` command collects native line coverage and fails below 99%. A dedicated E2E
project has no Unit runtime, but its source owner still does. Static `test:coverage:*` targets never
run the numeric collector or consume its report.

`test:coverage` aggregates all applicable static validators. Each applicable validator must also be
reachable from `test:quick`, directly or through the aggregate. A project README explains the
corpus, adapters, target names, and any inapplicable higher layer.

Omit inapplicable targets. Echo, no-op, success-sentinel, duplicate runtime, and compatibility-alias
targets are forbidden because they falsely claim a quality boundary exists.
