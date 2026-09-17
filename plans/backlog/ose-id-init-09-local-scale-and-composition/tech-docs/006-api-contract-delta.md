# API Contract Delta

## Contract Boundary

This slice adds a local runner API: a versioned command plus JSON Schema-validated input, public output,
private control, readiness, and cleanup contracts. It does not add or change an OSE ID HTTP business or
OIDC/OAuth operation. The existing HTTP surface is nevertheless exercised through a no-affinity proxy;
its externally observable method, path, schema, auth, status, error, privacy, and protocol semantics must
remain unchanged.

The runner contract is not described as REST. Its machine-readable sources are:

- `specs/apps/ose/id-web/contracts/local-stack/input-manifest.schema.json`;
- `specs/apps/ose/id-web/contracts/local-stack/public-descriptor.schema.json`;
- `specs/apps/ose/id-web/contracts/local-stack/control-message.schema.json`; and
- `specs/apps/ose/id-web/contracts/local-stack/diagnostic.schema.json`.

The retained backend API source remains `specs/apps/ose/id-be/contracts/openapi.yaml` plus its referenced
split files. Retained BFF HTTP contracts remain `specs/apps/ose/id-web/contracts/openapi.yaml` plus its
referenced split files.

## Operation Index

| Action | Operation                                       | Caller                                   | Detailed section                                                |
| ------ | ----------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| ADD    | `ose-id-web-e2e:local-stack` start/hold command | owning app/test runner or developer      | [Start and hold](#1-start-and-hold-the-owned-stack)             |
| ADD    | one control-channel ready message               | owning parent process                    | [Ready descriptor](#2-publish-readiness-and-descriptors)        |
| ADD    | `ose-id-web-e2e:local-stack-cleanup` command    | the same owning parent/recovery operator | [Exact cleanup](#3-clean-up-one-owned-stack)                    |
| ADD    | schema-version negotiation                      | any local runner consumer                | [Version negotiation](#4-negotiate-the-runner-contract-version) |

There is no API operation update or deletion. Moving one public endpoint behind a no-affinity proxy is a
runtime topology change only; hostname, public port, issuer, routes, and wire semantics remain stable.

## Shared Runner Rules

- Every filesystem path is absolute after canonicalization, inside the runner-owned restrictive temp
  root, and checked against the ownership manifest before write or removal. Repository root, home, `/`,
  unresolved variables, glob characters, symlink escapes, and user-owned paths are rejected.
- All addresses are loopback. Callback/logout URIs are exact loopback HTTP values registered in the
  input. Non-loopback, production-looking, wildcard, or insecure alternate issuer inputs fail before any
  child starts.
- The parent passes the decimal inherited control file descriptor through
  `OSE_ID_RUNNER_CONTROL_FD`; the descriptor contains no secret, only a process-local channel number.
  Private descriptor paths/content never appear in argv, stdout, Git, screenshots, or public output.
- Input is immutable after admission. Output files are written to a sibling temporary file, flushed,
  permissioned, and atomically renamed. Schema-invalid or partially written files are never consumed.
- Exit codes are stable: `0` success/clean stop, `64` invalid input, `69` unavailable dependency or
  occupied resource, `70` child/runtime failure, `74` descriptor/I/O failure, and `78` forbidden
  configuration. Cleanup diagnostics never replace an earlier primary exit code.
- All JSON objects use `additionalProperties: false`; timestamps are UTC RFC 3339; IDs are opaque;
  sensitive fields are structurally excluded rather than relying only on redaction.

## Detailed Operation Contracts

### 1. Start and hold the owned stack

From the repository execution worktree:

```bash
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web-e2e:local-stack -- --input-manifest=/absolute/owned/input.json --public-descriptor=/absolute/owned/public.json
```

**Caller/auth/context.** A local outer runner or developer with filesystem access to its own workspace.
There is no network authentication. Admission authority comes from the current OS process, canonical
paths, loopback-only values, contract version, and a unique `stackId`; it never implies product identity.

**Input manifest.** UTF-8 JSON, mode `0600`, maximum 256 KiB. Required example:

```json
{
  "schemaVersion": "1.0",
  "stackId": "lms-auth-e2e-0001",
  "mode": "test",
  "ports": {
    "web": 3500,
    "api": 8501,
    "postgres": 5438,
    "smtp": 1026,
    "mailpitWeb": 8026,
    "fakeGoogle": 8502
  },
  "clients": [
    {
      "clientId": "synthetic-dependent-app",
      "redirectUris": ["http://127.0.0.1:3400/auth/oidc/callback"],
      "postLogoutRedirectUris": ["http://127.0.0.1:3400/auth/signed-out"],
      "audiences": ["urn:ose:lms-api"],
      "scopes": ["openid", "profile", "ose.context", "ose.lms"]
    }
  ],
  "fixtures": {
    "persons": [
      {
        "fixtureRef": "personal-user",
        "email": "person@example.test",
        "emailVerified": true,
        "authenticationMethods": ["password"]
      }
    ],
    "companies": [
      {
        "fixtureRef": "company-a",
        "displayName": "Company A",
        "members": [
          {
            "personRef": "personal-user",
            "authority": "membership_admin"
          }
        ],
        "entitlements": ["ose-lms"]
      }
    ]
  },
  "features": {
    "google": "fake",
    "mailCapture": true,
    "instanceCount": 2
  }
}
```

`schemaVersion`, `stackId`, `mode`, `clients`, `fixtures`, and `features` are required. `ports` may be
omitted only when the owner has requested repository-registry defaults and the runner can prove every
one free. `stackId` matches `^[a-z][a-z0-9-]{2,62}$`. `mode` is `test` or `interactive`. Client IDs,
audiences, scopes, fixture refs, product keys, and synthetic `.test` emails use closed/bounded schemas.
Real domains, secrets, password values, provider credentials, arbitrary SQL, shell fragments, paths,
container names, or cleanup selectors are forbidden fields.

**Start result.** The command validates everything before creating a child, then starts owned
PostgreSQL, Mailpit, fake Google when requested, migrations/fixtures, backend A/B, web A/B, and public
no-affinity proxies. It holds until a parent signal or the first child failure. Readiness is published
only by operation 2. Stdout/stderr contain bounded sanitized lifecycle events, never descriptors or
secrets.

**Idempotency/concurrency.** A second live start with the same `stackId`, port, Compose project, manifest
path, or owned resource fails `69` without adopting/killing it. Distinct admitted stack IDs/ports run
concurrently. An interrupted prior manifest requires exact recovery cleanup before reuse.

**Failures.** Invalid/schema-unknown input `64`; occupied/unavailable prerequisite `69`; child crash or
readiness timeout `70`; atomic-output/control-channel failure `74`; non-local/fake-production/unsafe
configuration `78`. The runner cleans only resources recorded as owned and returns the earliest primary
failure plus separate cleanup diagnostics.

**Compatibility/rollback.** Additive local Nx target. Rollback removes the target and schemas after all
owned stacks are cleaned; it leaves OSE ID data/migrations and dependent apps unchanged. A dependent app
may not copy the private implementation when the version is unavailable.

**BDD proof.** Follow the
[operation-scoped Gherkin proof](#runner-start-and-hold-contract-scenarios).

### 2. Publish readiness and descriptors

**Transport/caller.** After every component passes bounded health checks, the child writes exactly one
newline-delimited `ready` control message to the inherited control FD. The caller validates
`control-message.schema.json` and reads the atomically written public descriptor. No HTTP polling alone
counts as contract readiness.

Control message example:

```json
{
  "schemaVersion": "1.0",
  "kind": "ready",
  "stackId": "lms-auth-e2e-0001",
  "publicDescriptorPath": "/absolute/owned/public.json",
  "privateDescriptorPath": "/absolute/owned/private.json"
}
```

The control pipe and private file are `0600`; the public file is at most `0644` inside the owned temp
root and contains no credential/capability.

Public descriptor example:

```json
{
  "schemaVersion": "1.0",
  "stackId": "lms-auth-e2e-0001",
  "status": "ready",
  "endpoints": {
    "web": "http://127.0.0.1:3500",
    "api": "http://127.0.0.1:8501",
    "issuer": "http://127.0.0.1:8501",
    "discovery": "http://127.0.0.1:8501/.well-known/openid-configuration",
    "jwks": "http://127.0.0.1:8501/connect/jwks",
    "mailpit": "http://127.0.0.1:8026",
    "fakeGoogle": "http://127.0.0.1:8502"
  },
  "clients": [
    {
      "clientId": "synthetic-dependent-app",
      "redirectUris": ["http://127.0.0.1:3400/auth/oidc/callback"],
      "audiences": ["urn:ose:lms-api"],
      "scopes": ["openid", "profile", "ose.context", "ose.lms"]
    }
  ],
  "fixtures": {
    "personal-user": "30000000-0000-4000-8000-000000000009",
    "company-a": "40000000-0000-4000-8000-000000000009"
  },
  "diagnostics": "/absolute/owned/sanitized-diagnostics.json"
}
```

The private descriptor contains exact PIDs/start identities, Compose labels/project, container/network/
volume IDs, restrictive temp/key/capability paths, internal A/B addresses, and cleanup state. It never
contains a real secret; synthetic client credentials/test capabilities are permitted only where a
fixture contract requires them and remain private.

**Semantics.** `ready` means both public proxies can reach two healthy web and backend instances, all
instances share required keys/state, schema/fixtures match, optional fake/Mailpit dependencies are ready,
and public discovery/JWKS agree with the descriptor. A child failure before readiness produces a
`failed` control message with safe `diagnosticCode` and the command's stable exit code, not a partial
public descriptor.

**Replay/privacy.** One start publishes at most one `ready`; a duplicate/mismatched stack ID/path is
invalid. Public descriptor logging is allowed only after schema-based secret scanning. Private paths and
content never enter stdout, test reports, screenshots, or Git.

**BDD proof.** Follow the
[operation-scoped Gherkin proof](#readiness-and-descriptor-contract-scenarios).

### 3. Clean up one owned stack

The same parent invokes:

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web-e2e:local-stack-cleanup -- --stack-id=lms-auth-e2e-0001
```

Before launch it passes a control FD in `OSE_ID_RUNNER_CONTROL_FD`; the first JSON message on that FD is:

```json
{
  "schemaVersion": "1.0",
  "kind": "cleanup",
  "stackId": "lms-auth-e2e-0001",
  "privateDescriptorPath": "/absolute/owned/private.json"
}
```

The private path never appears in argv.

**Caller/validation.** Only the owner/recovery process possessing the descriptor path and file access.
The cleanup command validates schema, stack ID, canonical path, file owner/mode, per-resource ownership
labels, PID executable/start identity, and current target before each stop/removal.

**Success.** Exit `0` after reverse-order shutdown, idempotent removal of every manifest-owned process,
container, network, volume, port binding, temp key/capability, and private descriptor, plus an atomic
sanitized diagnostic stating `cleanupStatus: complete`. The public descriptor is removed last. A repeat
with a validated terminal diagnostic and no resources is also `0`.

**Failures/destructive safety.** Invalid/mismatched descriptor is `64` and removes nothing. I/O failure
is `74`; unsafe target is `78`; incomplete owned-resource cleanup is `70` with each residue named by safe
opaque ID. Cleanup never expands a prefix/glob, follows a symlink, kills a merely matching PID/name,
removes an unowned Docker object, or touches another concurrent stack. On parent/test failure, cleanup
reports separately and preserves the original primary exit code.

**Compatibility/rollback.** Major-version cleanup tools reject unknown descriptors rather than guessing.
Every supported prior minor descriptor has a fixture test. Removing the public target is allowed only
after no supported consumer and no owned stack remain.

**BDD proof.** Follow the
[operation-scoped Gherkin proof](#owned-stack-cleanup-contract-scenarios).

### 4. Negotiate the runner contract version

- **Operation/action:** local runner contract negotiation — `ADD`.
- **Caller/ownership/context:** one local developer, CI harness, or dependent-app runner invokes the
  version validator before start/inspect/cleanup. It owns only the supplied manifest/control document
  and gains no identity, company, filesystem, network, or process authority from version negotiation.
- **Input:** every manifest, control message, descriptor, and diagnostic requires semantic
  `schemaVersion` with one major and one minor component. Example runner input:

  ```json
  {
    "schemaVersion": "1.0",
    "operation": "start",
    "supportedVersions": ["1.0", "1.1"],
    "manifestPath": "<validated-plan-owned-path>"
  }
  ```

- **Success:** exit `0` and emit only the highest mutually supported `1.x` declared by the executable,
  before delegating to the requested operation:

  ```json
  {
    "schemaVersion": "1.1",
    "status": "compatible",
    "selectedVersion": "1.1",
    "operationStarted": false
  }
  ```

- **Failures/validation:** unsupported major, malformed version, missing required field, unknown
  security-sensitive field, or no mutual version returns exit `64` before filesystem/network/process
  mutation:

  ```json
  {
    "schemaVersion": "1.0",
    "status": "rejected",
    "code": "unsupported_contract_version",
    "operationStarted": false,
    "correlationId": "<opaque>"
  }
  ```

- **Replay/concurrency/limits/privacy:** pure deterministic validation is idempotent, unpaginated, and
  safe under concurrent invocations; it has bounded document size/depth and no automatic retry. It logs
  only selected version, operation kind, safe code, and correlation ID—never manifest contents, paths,
  environment values, capabilities, credentials, or ownership handles.
- **Publication/compatibility:** publish schemas at the four exact
  `specs/apps/ose/id-web/contracts/local-stack/*.schema.json` paths in the file-impact tree and version
  the runner command help beside them. Major `1` accepts an older `1.x` minor only when all required
  fields remain understood and rejects unknown security-sensitive fields.

Minor additions must be optional, default-safe, structurally non-sensitive, and ignored only when the
schema explicitly permits that version. Removing/renaming fields, widening hosts/paths, changing cleanup
ownership, or altering exit meaning requires a new major version and a dependent-app migration plan.

- **Rollback:** retain schemas and parser support while any owned descriptor or dependent runner uses
  them; rollback may stop emitting the newest optional minor only after compatibility fixtures prove all
  consumers negotiate an older supported minor. It must never reinterpret an unsupported document.
- **Proof:** follow the
  [operation-scoped Gherkin proof](#runner-version-negotiation-contract-scenarios).

### 5. HTTP, protocol, page, and BFF no-delta disposition

Plan 09 changes local process composition and routing topology. It does not retain, add, update, or
delete an externally observable HTTP, BFF, page, OIDC, or OAuth contract. The only operations in this
document's index are therefore the four added local runner operations above.

**Frozen inputs.** Before implementation, Phase 0 must resolve and archive all referenced files and
record their SHA-256 digests for:

- the fully bundled `specs/apps/ose/id-be/contracts/openapi.yaml`;
- the fully bundled `specs/apps/ose/id-web/contracts/openapi.yaml`;
- OIDC discovery and JWKS metadata emitted by the Plan 04 implementation;
- the sorted first-party page and BFF route manifest delivered by Plans 05–08; and
- the cookie-name, issuer, public origin, redirect URI, logout URI, CORS, cache, and security-header
  configuration that participates in the public contract.

The archive is an execution input, not a hand-authored replacement for the predecessor contracts. Its
manifest contains the predecessor Git commit, generator version, canonicalization version, source path,
media type, byte digest, semantic digest, and output path for every artifact. The executor must stop if a
referenced source is missing, dirty relative to the recorded commit, unbundled, or not reproducible.

A representative manifest entry is:

```json
{
  "schemaVersion": "1.0",
  "sourceCommit": "<40-character-commit>",
  "canonicalizer": "ose-contract-c14n/1.0",
  "artifacts": [
    {
      "surface": "id-be-openapi",
      "source": "specs/apps/ose/id-be/contracts/openapi.yaml",
      "mediaType": "application/vnd.oai.openapi+yaml;version=3.1",
      "byteSha256": "<64-lowercase-hex>",
      "semanticSha256": "<64-lowercase-hex>",
      "archive": "<owned-artifact-directory>/id-be.openapi.json"
    }
  ]
}
```

**Canonical comparison.** The contract verifier must dereference local OpenAPI references, reject
remote references, normalize object-key ordering and line endings, preserve array order where order is
semantic, and compare the normalized documents structurally. It must separately compare the sorted
method/path/operation-id set, parameter locations and requirements, security schemes, request and response
media types, status codes, headers, closed schemas, examples, stable problem codes, pagination,
idempotency, replay, rate-limit, cache, and deprecation metadata. OIDC comparison must cover issuer,
authorization/token/revocation/logout/JWKS endpoints, grant and response types, PKCE methods, scopes,
claims, signing algorithms, and key identifiers. Page/BFF comparison must cover every route, HTTP method,
redirect target, cookie attribute, CSRF requirement, cache policy, security header, and serialized
request/problem/response schema.

Generated timestamps, absolute artifact paths, process IDs, ephemeral ports outside the declared public
origins, instance identities, and document formatting are the only ignored fields. The ignore list is a
closed versioned fixture. Adding an ignore requires a plan amendment and a regression that proves it
cannot mask a public contract change.

**Required equality.** Before and after no-affinity proxying, the verifier must prove exact semantic
equality for all frozen surfaces. The backend public origin and issuer remain
`http://127.0.0.1:8501`; the web origin remains `http://127.0.0.1:3500`. There is no change to an
endpoint, method, path, query or header parameter, status, media type, body schema, serialized example,
problem, authentication or authorization rule, tenant rule, idempotency or replay rule, pagination,
rate limit, cache rule, log/redaction rule, discovery document, OpenAPI document, or generated consumer.
Any difference is an undeclared API `UPDATE` and blocks Plan 09 until this API delta document, the
machine-readable source, migrations, compatibility policy, rollback, and per-operation Gherkin are
amended together.

**No-affinity proof without wire changes.** The proxy must not inject an instance header, affinity
cookie, alternate route, debug field, query parameter, or body property, even in test mode. A
runner-owned observation sink records a sanitized correlation hash, selected opaque instance fixture,
request start/end, and outcome outside the public response. Test probes correlate their locally generated
request IDs with that private evidence, assert that successive requests reached distinct healthy
instances, and then prove the public responses equal the frozen contract. The private observation schema
forbids tokens, cookies, authorization codes, email addresses, company/person identifiers, request or
response bodies, private descriptor paths, network addresses, and signing material.

A representative private observation is:

```json
{
  "schemaVersion": "1.0",
  "stackId": "lms-auth-e2e-0001",
  "correlationHash": "<64-lowercase-hex>",
  "instanceFixture": "backend-b",
  "startedAt": "2026-09-15T06:00:00Z",
  "outcome": "completed"
}
```

**State and privacy.** Stopping either A instance between protocol steps must not invalidate an
authorization transaction, CSRF value, session, PKCE exchange, context choice, consent decision,
passkey challenge, MFA challenge, Google correlation, or company-admin action. Correctness state lives
in PostgreSQL or the explicitly shared cryptographic/state facilities defined by Plans 02–08; process
memory and local files may only contain replaceable caches. Logs, screenshots, traces, DOM/RSC payloads,
browser storage, URLs, public descriptors, and ordinary responses expose neither instance identity nor
private observation data.

**Rollout and rollback.** The executor may route the stable public origins through the no-affinity
proxies only after baseline capture, pre-proxy live verification, two-instance readiness, and post-proxy
semantic equality all pass. Failure keeps or restores direct routing to one healthy instance at the same
origins and issuer, stops the second instances and proxies, and runs exact owned-resource cleanup. It
does not rewrite identity data, rotate keys, change clients, downgrade migrations, or modify a dependent
application. The equality suite must pass again after rollback.

## Gherkin-Style Contract Scenarios

Canonical destinations are the app-scoped local-runtime feature files mapped in technical document 005.

### Runner start and hold contract scenarios

- **Exact scenarios:** `AC-STACK-01 — Start a deterministic complete stack`, `AC-STACK-02 — Fail at
the first unready dependency`, and `AC-BOUNDARY-01 — Reject non-local operation`.
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`.
- **Layer disposition:** Unit manifest/admission/lifecycle policy, Integration schema/process/ownership
  composition, and E2E success, invalid-input, dependency-failure, and zero-residue proof are required;
  no exemption applies.

```gherkin
Feature: Local identity stack runner contract

  Rule: Start validates authority and owns every created resource

  Scenario: Start a deterministic complete stack
    Given a version-supported loopback manifest with a unique stack identity and synthetic fixtures
    When the owning runner starts the identity stack
    Then it publishes one schema-valid ready descriptor after every dependency is ready
    And every created process container network volume port file and capability is recorded as owned
    And no private descriptor or secret appears in arguments output logs or public evidence

  Scenario: Fail at the first unready dependency
    Given one required owned dependency cannot become ready
    When the owning runner starts the local identity stack
    Then the runner returns the stable dependency failure with a non-secret diagnostic
    And later services do not report false readiness
    And every resource already created by this stack is cleaned

  Scenario Outline: Reject non-local operation
    Given the input manifest contains <forbidden input>
    When the owning runner attempts to start the identity stack
    Then it returns the stable invalid or forbidden configuration status before mutation
    And no process container network volume port file fixture or descriptor is created

    Examples:
      | forbidden input |
      | a non-loopback callback |
      | a real provider credential |
      | an unknown security-sensitive field |
      | an unsafe path |
```

### Readiness and descriptor contract scenarios

- **Exact scenarios:** `RUNNER-READY-01 — Publish one schema-valid ready descriptor` and
  `RUNNER-READY-02 — Fail without publishing a partial public descriptor`.
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`.
- **Layer disposition:** Unit readiness/redaction/exit-state policy, Integration control-FD and atomic
  descriptor publication, and E2E valid-ready, dependency-failure, schema-validation, and secret-scan
  proof are required; no exemption applies.

```gherkin
Feature: Local identity stack runner contract

  Rule: Readiness is an atomic validated parent-child contract

  Scenario: Publish one schema-valid ready descriptor
    Given every owned dependency and both identity instances are healthy
    And the public and private descriptor destinations are validated and empty
    When the child publishes readiness on the inherited control channel
    Then exactly one ready message names the matching stack and descriptor paths
    And the atomically written public descriptor matches its schema and the live public endpoints
    And no credential capability private path or topology identity appears in public evidence

  Scenario: Fail without publishing a partial public descriptor
    Given one owned dependency fails before full-stack readiness
    When the child reports the stable failure on the inherited control channel
    Then no ready message or partial public descriptor is observable
    And the failure preserves a non-secret diagnostic and the primary exit status
```

### Owned-stack cleanup contract scenarios

- **Exact scenarios:** `AC-STACK-03 — Clean every exit path` and `AC-STACK-04 — Isolate concurrent
ownership manifests`.
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`.
- **Layer disposition:** Unit target/ordering/idempotency policy, Integration PID/Compose/path ownership
  checks, and E2E success, failure, crash, interrupt, repeated-cleanup, and concurrent-stack residue proof
  are required; no exemption applies.

```gherkin
Feature: Local identity stack runner contract

  Rule: Cleanup acts only on cryptographically and structurally proven ownership

  Scenario: Isolate concurrent ownership manifests
    Given two valid manifests use distinct stack identities and ports
    When both identity stacks run concurrently and one is cleaned
    Then the other stack remains ready and unchanged
    And cleanup removes only resources proven to belong to the selected stack

  Scenario Outline: Clean every exit path
    Given an owned identity stack has reached <state>
    When <termination> occurs
    Then reverse-order cleanup validates and removes every owned resource
    And it preserves the earliest primary failure with separate cleanup diagnostics
    And repeating cleanup is safe and successful

    Examples:
      | state | termination |
      | starting | a child readiness failure |
      | ready | the test command fails |
      | ready | a child process crashes |
      | ready | the parent receives an interrupt |
      | cleaned | cleanup is invoked again |
```

### Runner version negotiation contract scenarios

- **Exact scenarios:** `RUNNER-VERSION-01 — Negotiate the highest mutually supported runner contract
minor` and `RUNNER-VERSION-02 — Reject an unsupported local runner contract before mutation`.
- **Canonical destination:** `specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature`.
- **Layer disposition:** Unit compatibility matrix and closed-schema validation, Integration
  schema/parser/command handoff, and E2E selected-version output, unsupported-major exit, zero mutation,
  mixed-minor compatibility, and dependent-app negotiation are required; no exemption applies.

```gherkin
Feature: Local identity stack runner contract negotiation

  Rule: Version negotiation completes before an operation receives authority

  Scenario: Negotiate the highest mutually supported runner contract minor
    Given the runner and consumer support overlapping minor versions in contract major one
    When the consumer negotiates the runner contract
    Then the highest mutually supported minor is selected without starting an operation
    And optional fields use only their schema-declared safe defaults

  Scenario: Reject an unsupported local runner contract before mutation
    Given the runner input has an unsupported major or no mutually supported minor
    When the consumer negotiates the runner contract
    Then the runner returns the stable unsupported-contract result
    And no filesystem network process container fixture or descriptor is created or changed
    And no manifest content path environment value capability credential or ownership handle is logged
```

### Dependent-runner composition contract scenario

- **Exact scenario:** `AC-COMPOSE-01 — Compose a dependent application` together with
  `AC-COMPOSE-02 — Reject fallback identity`.
- **Canonical destination:** `specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature`.
- **Layer disposition:** Unit public-descriptor allowlisting, Integration consumer handoff, and E2E
  personal/company sign-in plus dependency-unavailable behavior are required; no exemption applies.

```gherkin
Feature: Local identity stack consumer contract

  Rule: A dependent application consumes only the public versioned descriptor

  Scenario: Compose a dependent application
    Given the identity stack publishes a version-supported public descriptor
    When a synthetic dependent application completes personal and company sign-in journeys
    Then it uses only declared issuer client resource context and fixture fields
    And it does not read identity tables private descriptors or lifecycle implementation

  Scenario: Reject fallback identity
    Given the dependent application is configured to use OSE ID
    When the identity stack becomes unavailable
    Then the application returns the identity-dependency-unavailable result
    And no local credential debug identity trusted header or alternate issuer is accepted
```

### HTTP, OIDC, page, and BFF no-delta scenarios

- **Exact scenarios:** `AC-SCALE-01 — Complete authorization after instance replacement`,
  `AC-SCALE-03 — Complete a representative journey without affinity`, and operation-local contract
  equality and rollback scenarios shown below.
- **Canonical destinations:**
  `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature` and
  `specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature`.
- **Layer disposition:** Unit canonicalization/state rules, Integration pre/post-proxy contract equality,
  and E2E no-affinity journey, privacy, and rollback proof are required; no exemption applies.

```gherkin
Feature: Stateless local identity service

  Background:
    Given the frozen OSE ID public contracts were reproduced from the recorded predecessor commit
    And two healthy web instances and two healthy backend instances share required state and keys

  Scenario: An authorization journey survives instance replacement
    When a journey starts through instance A and both A instances stop before completion
    Then instance B completes the journey exactly once through the unchanged public contract
    And no affinity cookie process memory local file or alternate identity is required

  Scenario Outline: No-affinity routing preserves each public contract category
    Given the canonical baseline contains the <surface> contract
    When representative <surface> requests run before and after no-affinity proxy activation
    Then the normalized contract and every public observation are semantically equal
    And private runner evidence proves that distinct healthy instances served the requests
    And no instance identity or observation field enters the public wire contract

    Examples:
      | surface |
      | backend OpenAPI operations |
      | OIDC discovery and JWKS metadata |
      | first-party page routes |
      | BFF OpenAPI operations |
      | cookies redirects and security headers |

  Scenario Outline: Public contract drift blocks composition
    Given the post-proxy <surface> differs from its frozen canonical baseline
    When the contract verifier evaluates the no-delta assertion
    Then composition activation stops before the stable public origin is switched
    And the report identifies the surface JSON pointer expected value and observed value
    And no ignore rule is widened automatically

    Examples:
      | surface |
      | method path or operation identifier |
      | parameter security or media type |
      | request response or problem schema |
      | issuer endpoint grant scope claim or signing metadata |
      | page BFF cookie redirect cache or security header |

  Scenario: Instance handoff preserves correctness and privacy
    Given a stateful identity journey has completed its first step through one instance
    When that instance stops and the journey continues through another healthy instance
    Then the journey preserves its replay transaction tenant authorization and expiry rules
    And public responses logs screenshots browser state and URLs disclose no topology identity
    And private observations contain only the closed sanitized evidence fields

  Scenario: Rollback restores direct routing without contract or data change
    Given proxy activation or post-proxy equality verification fails
    When the owning runner rolls the composition back
    Then one healthy instance serves the same web origin API origin and issuer directly
    And the canonical equality suite passes after rollback
    And no identity row client key migration or dependent application is changed
```

## Proof and Quality-Gate Routing

| Contract                       | Unit                                                         | Integration                                               | E2E/live                                                       |
| ------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------- |
| Input/version/schema/admission | parser, allowlist, path/port/version validation              | atomic files/control FD/ownership manifest                | invalid matrix creates zero resources                          |
| Readiness/descriptors          | state machine, redaction, exit-code selection                | real child health and atomic publication                  | synthetic consumer uses public/private split                   |
| Cleanup                        | target validator, reverse order, primary-status preservation | PID/Compose/path identity and repeat cleanup              | success/failure/crash/interrupt/concurrent-stack residue proof |
| Public HTTP/BFF/OIDC no-delta  | canonicalizer, ignore-list, routing/config invariants        | pre/post proxy semantic equality and shared-state handoff | API quality gate and no-affinity browser/API journeys          |

The runner protocol is validated through JSON Schema, Unit, Integration, and E2E because the REST/
GraphQL-specific API quality gate cannot honestly validate a command/control-file API. The same delivery
still runs that gate against the unchanged live backend and BFF HTTP surfaces with their OpenAPI contracts.
There are no default layer exemptions; any per-scenario exception must use the canonical exemption comment
and pass static behavior-coverage validation.
