Feature: Capture strict metadata
  As a developer who cares about the privacy of my work
  I want FERRET to store lifecycle metadata only
  So that no prompt, response, tool argument, transcript path, or environment value is ever kept

  Scenario: Capture a valid lifecycle event
    Given FERRET is initialized with an empty local database
    When an adapter submits one schema-version-1.0 tool-completed event
    Then the CLI stores one event with its canonical hash and opaque identifiers
    And the stored record holds only the opaque workspace and session identifiers it was given
    And the direct capture command reports success

  Scenario Outline: Refuse a raw value in place of an opaque identifier
    Given FERRET is initialized with an empty local database
    When an adapter submits an otherwise valid event whose <field> is a raw <value>
    Then capture rejects the complete event without storing a partial row
    And the diagnostic names the <field> field without echoing its value

    Examples:
      | field       | value                 |
      | workspaceId | workspace path        |
      | sessionId   | harness session value |

  Scenario: Project raw hook JSON without retaining content
    Given a raw harness payload carrying prompt text, tool arguments, and environment values
    When capture-hook maps it through that harness's allowlist mapper
    Then only allowlisted metadata reaches the canonical envelope
    And the raw bytes stay in memory and are never spooled, logged, or written to SQLite
    And any diagnostic about the payload names no value taken from it

  Scenario: Record a tool completion whose result is a large image
    Given a raw Codex view_image completion whose result is a 1 MiB base64 image
    When capture-hook maps it through that harness's allowlist mapper
    Then one tool-completed event naming view_image is stored
    And no part of the image or of the other content reaches the store
    And any diagnostic about the payload names no value taken from it

  Scenario Outline: Reject a forbidden capture field
    Given FERRET is initialized with an empty local database
    When an adapter submits an otherwise valid event containing <field>
    Then capture rejects the complete event without storing a partial row
    And the diagnostic names the field category without echoing its value

    Examples:
      | field           |
      | prompt          |
      | response        |
      | tool_arguments  |
      | transcript_path |
      | environment     |

  Scenario: Reject an unknown capture field
    Given FERRET is initialized with an empty local database
    When an adapter submits an otherwise valid event with a property the schema does not define
    Then capture rejects the complete event without storing a partial row
    And the diagnostic names no field and echoes neither the unknown property name nor its value
