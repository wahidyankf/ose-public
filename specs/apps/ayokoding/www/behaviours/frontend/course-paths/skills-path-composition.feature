Feature: Skills accounting path composition

  As a reader following a skills path
  I want each published accounting path to retain its ordered course context
  So that the shared foundation can grow without changing what a reader is walking

  # Exemption(e2e): the e2e server reads the isolated fixture manifest set (AYOKODING_WEB_MANIFESTS_DIR points at the fixtures), so the published accounting manifests are not served at the browser boundary; alternative-proof: ayokoding-www:test:integration / skills-path-composition.steps.ts
  @e2e-exempt
  Scenario Outline: Each published accounting path lists its accounting courses in published order
    Given the published accounting manifest for "<path-id>"
    When its ordered course context is inspected
    Then it contains its published accounting order
    And every course context is represented by one course directory

    Examples:
      | path-id                        |
      | skills/conventional-accounting |
      | skills/sharia-accounting       |
