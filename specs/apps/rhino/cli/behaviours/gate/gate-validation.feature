@gate
Feature: Gate conformance validation

  Scenario: A check declared for pre-commit but not for ci violates the composition rule
    Given a check declares pre-commit but no ci surface or carve-out
    When "rhino-cli gate validate" runs
    Then it fails and names the Gate Composition Rule, gate, and ci surface

  Scenario: A mutation at pre-commit does not require a ci counterpart
    Given a mutation declares pre-commit but no ci surface
    When gate validate runs
    Then it succeeds

  Scenario: The staged-only carve-out exempts a check that cannot have a CI counterpart
    Given a staged-only check declares pre-commit but no ci surface
    When gate validate runs
    Then it succeeds and gate list reports the exemption

  Scenario: A surface file that stops invoking the registry is caught
    Given a declared pre-push surface has a non-delegating hook
    When gate validate runs
    Then it fails and names the hook file

  Scenario: A CI workflow that hardcodes a check instead of deriving it is caught
    Given a workflow command is absent from the CI registry
    When gate validate runs
    Then it fails and names that command

  Scenario: A registry matrix aggregate cannot omit its enumerator
    Given a matrix-driven CI gate has an aggregate missing its enumerate dependency
    When gate validate runs
    Then it fails and names the enumerate dependency and quality-gate

  Scenario: A verifies field naming no existing gate is caught
    Given a gate verifies a missing gate id
    When gate validate runs
    Then it fails and names both IDs

  Scenario: A hand-edited lint-staged block is caught
    Given package.json lint-staged differs from the registry projection
    When gate validate runs
    Then it names package.json and the emit command

  Scenario: A formatter without a verifying check fails validation
    Given a formatter mutation has no verifying check
    When gate validate runs
    Then it fails and names the formatter

  Scenario: A hand-wired gate is asserted present but not matrix-derived
    Given a hand-wired CI gate has its matching workflow job
    When gate validate runs
    Then it succeeds

  Scenario: A hand-wired gate whose job was deleted is caught
    Given a hand-wired CI gate has no matching workflow job
    When gate validate runs
    Then it fails and names the gate and workflow file

  Scenario: A commented hand-wired CI command does not satisfy the workflow contract
    Given a hand-wired CI command is only commented out
    When gate validate runs
    Then it fails and names the gate and workflow file

  Scenario: An inline-commented hand-wired CI command does not satisfy the workflow contract
    Given a hand-wired CI command is only inline-commented
    When gate validate runs
    Then it fails and names the gate and workflow file

  Scenario: A quoted hand-wired CI command does not satisfy the workflow contract
    Given a hand-wired CI command is only quoted text
    When gate validate runs
    Then it fails and names the gate and workflow file

  Scenario: A literal-disabled hand-wired CI command does not satisfy the workflow contract
    Given a hand-wired CI command has a literal-disabled step
    When gate validate runs
    Then it fails and names the gate and workflow file

  Scenario: A normalized literal-disabled hand-wired CI command does not satisfy the workflow contract
    Given a hand-wired CI command has a normalized literal-disabled step
    When gate validate runs
    Then it fails and names the gate and workflow file

  Scenario: A falsey literal-disabled hand-wired CI command does not satisfy the workflow contract
    Given a hand-wired CI command has falsey literal-disabled steps
    When gate validate runs
    Then it fails and names the gate and workflow file

  Scenario: Gate validation covers every hook surface
    Given pre-commit and pre-push invoke their declared gate surfaces
    And commit-msg is missing its declared gate surface invocation
    When "rhino-cli gate validate" runs
    Then validation fails and identifies the commit-msg hook

  Scenario: The shipped configuration passes
    Given the registry and surfaces as shipped by this plan
    When "rhino-cli gate validate" runs
    Then it exits zero

  Scenario: A gate declared without a CI group fails validation
    Given a gate entry in repo-config.yml carrying a ci surface and no ci_group field
    When "rhino-cli gate validate" runs
    Then it exits non-zero
    And its output names the offending gate id
    And its output states that ci_group is required

  Scenario: quality-gate must depend on build-rhino as well as enumerate and gate
    Given the quality-gate job's needs list omits build-rhino
    When "rhino-cli gate validate" runs
    Then it fails and names build-rhino

  Scenario: A gate run --surface=ci invocation must carry a selector
    Given a gate run --surface=ci step declares neither --only= nor --group=
    When "rhino-cli gate validate" runs
    Then it fails and states that the invocation must select exactly one matrix gate

  Scenario: An undeclared --group selector is rejected
    Given a gate run --surface=ci step's --group value matches no declared ci_group
    When "rhino-cli gate validate" runs
    Then it fails and names the undeclared group id

  Scenario: The gate job's Doctor bootstrap must use the resolver shim
    Given the gate job provisions Doctor tools via npm run doctor instead of the rhino-bin.sh shim
    When "rhino-cli gate validate" runs
    Then it fails and names the gate job's stale Doctor bootstrap

  Scenario: A matrix group id spliced directly into a shell command is rejected
    Given a CI matrix dispatcher step interpolates matrix.group.group directly into its run body without env indirection
    When "rhino-cli gate validate" runs
    Then it fails and states that the gate matrix id must be derived through env indirection

  Scenario: A matrix group id with a non-default env var name still validates
    Given a CI matrix dispatcher step carries matrix.group.group through a differently-named env var
    When "rhino-cli gate validate" runs
    Then it exits zero

  Scenario: A hook that bypasses the pinned RHINO binary is caught
    Given a declared pre-commit surface hook invokes rhino-cli gate run instead of the pinned RHINO binary
    When gate validate runs
    Then it fails and names the hook file and its ./rhino gate run invocation

  Scenario: A matrix group dispatched straight to the repository CLI is caught
    Given a CI matrix dispatcher step runs the repository CLI's gate run for its group instead of the pinned RHINO binary
    When "rhino-cli gate validate" runs
    Then it fails and states that the group must be dispatched through ./rhino gate run --surface ci
