Feature: Benchmark reference generation

  As a content maintainer
  I want the AI model benchmark reference tables to be regenerated from a single dataset
  So that docs/reference/ai-model-benchmarks.md never drifts from models.ts

  Background:
    Given a reference document with a roster generated block containing stale inner content

  # Exemption(integration): the generator writes only its fixed tracked reference path, so an integration run would rewrite a repository document; alternative-proof: ayokoding-www:test:unit / Generating the benchmark reference refreshes its generated tables and leaves the rest of the page as written
  @integration-exempt
  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Generating the benchmark reference refreshes its generated tables and leaves the rest of the page as written
  @e2e-exempt
  # Behaviour: AYW-081
  Scenario: Generating the benchmark reference refreshes its generated tables and leaves the rest of the page as written
    When the benchmark reference generator runs in generate mode
    Then the stale inner text should be replaced by the generated block
    And the lead-in and trailing prose should be unchanged
    And the BEGIN and END marker tags should remain in place

  # Exemption(integration): the generator writes only its fixed tracked reference path, so an integration run would rewrite a repository document; alternative-proof: ayokoding-www:test:unit / Generating from a page whose generated block is never closed fails with an error naming the block
  @integration-exempt
  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Generating from a page whose generated block is never closed fails with an error naming the block
  @e2e-exempt
  # Behaviour: AYW-083
  Scenario: Generating from a page whose generated block is never closed fails with an error naming the block
    Given a reference document whose roster block has a BEGIN marker but no END marker
    When the benchmark reference generator runs in generate mode
    Then it should throw an error naming the unclosed roster marker

  # Exemption(integration): the generator writes only its fixed tracked reference path, so an integration run would rewrite a repository document; alternative-proof: ayokoding-www:test:unit / Generate mode is idempotent
  @integration-exempt
  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Generate mode is idempotent
  @e2e-exempt
  Scenario: Generate mode is idempotent
    When the benchmark reference generator runs twice in generate mode
    Then the two outputs should be byte-identical with no duplicated content

  # Exemption(integration): the generator writes only its fixed tracked reference path, so an integration run would rewrite a repository document; alternative-proof: ayokoding-www:test:unit / Validate mode exits non-zero on drift
  @integration-exempt
  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Validate mode exits non-zero on drift
  @e2e-exempt
  # Behaviour: AYW-082
  Scenario: Validate mode exits non-zero on drift
    When the benchmark reference generator runs in validate mode
    Then it should detect drift and signal a non-zero exit
