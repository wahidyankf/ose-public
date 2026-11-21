Feature: The toolchain catalog is pinned
  As a maintainer
  I want every image pinned by digest and every derived image tagged by its recipe
  So that a run uses exactly the toolchain it was tested with

  # Behaviour: AYC-037
  # Behaviour: AYC-058
  Scenario: An image without a digest stops the CLI
    Given a catalog entry whose image has a tag but no digest
    When I list the toolchains
    Then it exits with status 2
    And standard error names error code "ayokoding.catalog.unpinned-image"

  # Behaviour: AYC-011
  Scenario: The toolchain list names each id, kind, and version
    Given the embedded catalog
    When I list the toolchains
    Then each line shows an id, a kind, a version, and a digest-pinned image

  # Behaviour: AYC-030
  Scenario: A catalog file named by --catalog replaces the embedded catalog
    Given a catalog file that lists the toolchains python and postgres
    When I list the toolchains
    Then the list names only the toolchains python and postgres

  Scenario: A derived image tag changes when its recipe changes
    Given a derived toolchain recipe
    When one byte of its Dockerfile changes
    Then its image tag changes

  # Behaviour: AYC-073
  Scenario Outline: A locally built toolchain image runs without a registry pull
    Given <setup>
    When <action>
    Then <outcome>

    Examples:
      | setup                                                  | action                              | outcome                                                              |
      | a derived toolchain recipe in the selected Podman store | I build and run the derived image   | the image built is the image run without a registry pull or push     |
      | an environment image in the selected Podman store       | I run the environment image         | the local image is used without a registry pull                      |
