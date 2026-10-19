Feature: The toolchain catalog is pinned
  As a maintainer
  I want every image pinned by digest and every derived image tagged by its recipe
  So that a run uses exactly the toolchain it was tested with

  # Exemption(e2e): catalog decoding and tag computation read local files and need no container; alternative-proof: ayokoding-cli:test:integration / An image without a digest stops the CLI
  @e2e-exempt
  Scenario: An image without a digest stops the CLI
    Given a catalog entry whose image has a tag but no digest
    When I list the toolchains
    Then it exits with status 2
    And standard error names error code "ayokoding.catalog.unpinned-image"

  # Exemption(e2e): catalog decoding and tag computation read local files and need no container; alternative-proof: ayokoding-cli:test:integration / The toolchain list names each id, kind, and version
  @e2e-exempt
  Scenario: The toolchain list names each id, kind, and version
    Given the embedded catalog
    When I list the toolchains
    Then each line shows an id, a kind, a version, and a digest-pinned image

  # Exemption(e2e): catalog decoding and tag computation read local files and need no container; alternative-proof: ayokoding-cli:test:integration / A derived image tag changes when its recipe changes
  @e2e-exempt
  Scenario: A derived image tag changes when its recipe changes
    Given a derived toolchain recipe
    When one byte of its Dockerfile changes
    Then its image tag changes
