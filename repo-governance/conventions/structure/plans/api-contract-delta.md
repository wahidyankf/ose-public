---
description: "The numbered API-contract-delta document for API changes and API-adjacent evidenced no-delta decisions"
when_to_use: "Use when a plan adds, updates, deletes, or deliberately retains an HTTP, BFF, RPC, event, or standard protocol contract, or an API-adjacent surface needs an evidenced no-delta decision."
---

# API Contract Delta in Plans

An API-affecting mature plan uses the directory technical form and maps exactly one separately
numbered `NNN-api-contract-delta.md` from `tech-docs/README.md`. Do not scatter the authoritative API
delta across architecture, PRD, Gherkin, and delivery prose. An API-adjacent plan with no contract
change records an evidenced no-delta disposition there.

“API” includes public and internal HTTP operations, BFF routes/actions, RPC, events/messages, and
standard protocol endpoints such as OAuth 2.0 or OpenID Connect. Do not describe a standard protocol
endpoint as arbitrary REST when its specification defines different request or response semantics.

## Required Operation Index

Start with a compact inventory that assigns every operation exactly one `ADD`, `UPDATE`, `DELETE`,
or `RETAIN` action. The inventory is navigation only. **A table or endpoint list is never a complete
API contract.** Every inventory row links to its own detailed operation section in the same document.

## Required Detailed Operation Contract

For every indexed operation, provide a complete section that includes:

- exact method/operation and path, topic, procedure, or protocol endpoint;
- owning surface and intended caller;
- authentication, authorization, scopes/audience, and tenant/context derivation;
- exact request headers, path/query parameters, media type, body schema, field constraints, and a
  representative serialized example;
- exact success status, response headers, redirect behaviour, media type, body schema, field meaning,
  and a representative serialized example;
- every stable failure status and problem/error code, including when two failures intentionally share
  an enumeration-safe response;
- validation, idempotency, replay, concurrency/version, pagination, and rate-limit behaviour where
  applicable;
- cache behaviour, sensitive-field and enumeration/error-disclosure constraints, logging/redaction,
  and forbidden browser-visible or persisted values;
- OpenAPI, AsyncAPI, discovery metadata, schema, generated-client, and codegen effects;
- old/new consumer compatibility, rollout order, rollback trigger, and retained behaviour; and
- either full inline Gherkin-style scenarios or an exact anchor to this operation's one-to-one
  detailed scenario set in the same API document or the plan's dedicated numbered BDD/spec-delta
  companion in the same `tech-docs/` folder. The scenarios cover success, validation,
  authorization/context, stable errors, replay/concurrency, and privacy boundaries. The operation
  packet names the exact scenario IDs/titles, canonical `specs/**` destination, and Unit,
  Integration, and E2E proof or valid per-scenario exemptions.

Use `none` for an inapplicable field rather than omitting it. A DELETE names the replacement or
explains the intentional break and migration. A RETAIN is deliberate only when a neighboring change
could otherwise alter the contract; do not inventory unrelated endpoints. Standard-protocol sections
may reference the controlling RFC/profile for wire fields, but still spell out this service's exact
registration, allowed variants, statuses, redirects, errors, security constraints, and examples.

The Gherkin illustrates the operation contract. An anchor must target a unique detailed set in one
of the two allowed documents. A summary table, generic “BDD map”, prose pointer such as “covered by
authentication scenarios”, or pointer outside those documents is insufficient. Copy-ready scenarios
for canonical `specs/**` follow the repository's app/domain-scoped rule and exclude plan metadata.

Put every structured serialized request, response, event, message, manifest, descriptor, or problem
example in its own fenced block with the exact language identifier, such as `json`, `yaml`, or `http`.
Do not compress a structured payload into inline code; inline code is reserved for field names, scalar
values, short media types, and schema/type notation that is not an example payload.

## No-Delta Disposition

A no-delta document names the inspected surfaces and evidence, states that no operation or
machine-readable contract changes, and lists the contracts that remain authoritative. It must not
claim “no API change” while adding an undocumented BFF route, callback, event, or protocol endpoint.

The API document is a plan execution contract, not the canonical runtime contract. Delivery still
updates owning `specs/` Gherkin and machine-readable artifacts where applicable. `delivery.md` also
follows the [manual API recipe contract](../../../development/quality/manual-behavioural-verification/api-verification.md#formal-plan-recipe-contract): literal `rtk curl` success/failure commands per changed HTTP operation, assertions, synthetic fixtures,
attributable evidence, cleanup, and failure routing. Prose or client tests do not replace live wire proof.

## Enforcement Disposition

**Unenforced by decision.** The plan checker reviews operation-packet completeness and whether an
API-adjacent plan's evidence reasonably supports no delta. A deterministic check cannot establish
those domain-specific semantic judgements across HTTP, BFF, RPC, event, and standard-protocol
contracts; syntax and structure validators remain supporting evidence, not claimed coverage.
