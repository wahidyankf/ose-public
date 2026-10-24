Feature: Legacy-migrated courses are complete

  As Sari, a learner who needs a subject only the legacy tree used to teach
  I want each of the 48 migrated courses to be a finished course
  So that I am not left with a thinner experience than the rest of the catalog

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / No migrated course is an outline
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / No migrated course is an outline
  @e2e-exempt
  Scenario: No migrated course is an outline
    Given the 48 course slugs this plan writes
    When each course's frontmatter is read
    Then no course carries the outline status
    And each course declares the format this plan assigned it

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every migrated course reaches its mode's word floor and has a capstone and drilling
  @integration-exempt
  # Exemption(e2e): course size and structure are properties of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every migrated course reaches its mode's word floor and has a capstone and drilling
  @e2e-exempt
  Scenario: Every migrated course reaches its mode's word floor and has a capstone and drilling
    Given the 48 course slugs this plan writes
    When each course's pages are read
    Then each By Example course has at least 28000 words and each Annotated-Concept course has at least 22000 words
    And each course has a learning/capstone/overview.md of at least 800 words
    And each course has a drilling/overview.md with the five required sections

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every code-bearing example is a harness unit
  @integration-exempt
  # Exemption(e2e): harness opt-in is a property of committed files, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every code-bearing example is a harness unit
  @e2e-exempt
  Scenario: Every code-bearing example is a harness unit
    Given the 48 course slugs this plan writes
    When each course's learning/code and drilling/code folders are searched for run specifications
    Then every code-bearing example, kata, and capstone has a run.yaml
    And no run.yaml performs a real network call

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / AI coding-agent courses date every version-specific claim
  @integration-exempt
  # Exemption(e2e): reference dating is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / AI coding-agent courses date every version-specific claim
  @e2e-exempt
  Scenario: AI coding-agent courses date every version-specific claim
    Given the claude-code-for-engineers, hermes-agent-for-engineers, openclaw-for-engineers, and pi-coding-agent-for-engineers courses
    When each course's References section is read
    Then every version-specific or current-behaviour claim has an access date
    And every runnable example drives a fixture shim rather than a live network call
