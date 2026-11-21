Feature: Index file generation

  As a content maintainer
  I want _index.md files to be auto-generated with child listings
  So that section pages always show up-to-date navigation

  Background:
    Given a temporary content directory

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Section _index.md lists direct children sorted by weight
  @e2e-exempt
  # Behaviour: AYW-078
  Scenario: Section _index.md lists direct children sorted by weight
    Given a section "tools" with children weighted 300, 100, and 200
    When the index generator runs in generate mode
    Then the tools _index.md should list children in weight order 100, 200, 300

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Nested sections render with indentation
  @e2e-exempt
  Scenario: Nested sections render with indentation
    Given a section "tools" containing a child section "react" with leaf page "overview"
    When the index generator runs in generate mode
    Then the tools _index.md should show "overview" indented under "react"

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Existing frontmatter is preserved during generation
  @e2e-exempt
  Scenario: Existing frontmatter is preserved during generation
    Given a _index.md with frontmatter title "My Tools" and weight 500
    When the index generator runs in generate mode
    Then the frontmatter should contain title "My Tools" and weight 500

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Validate mode detects stale _index.md
  @e2e-exempt
  # Behaviour: AYW-079
  Scenario: Validate mode detects stale _index.md
    Given a section with a child page not listed in its _index.md
    When the index generator runs in validate mode
    Then it should report the _index.md as out of date

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Generate mode is idempotent
  @e2e-exempt
  Scenario: Generate mode is idempotent
    Given a section with up-to-date _index.md files
    When the index generator runs in generate mode
    Then no files should be reported as changed

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Missing frontmatter fields are added
  @e2e-exempt
  Scenario: Missing frontmatter fields are added
    Given a _index.md without date or draft fields
    When the index generator runs in generate mode
    Then the _index.md should contain a date field
    And the _index.md should contain draft set to false

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / The course catalog index holds only its frontmatter
  @e2e-exempt
  Scenario: The course catalog index holds only its frontmatter
    Given a "learn/courses" section in locale "en" with two course sections
    When the index generator runs in generate mode
    Then the learn/courses _index.md contains only its frontmatter

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / Each course index lists its own pages
  @e2e-exempt
  Scenario: Each course index lists its own pages
    Given a "learn/courses" section in locale "en" with two course sections
    When the index generator runs in generate mode
    Then each course _index.md still lists its own children
