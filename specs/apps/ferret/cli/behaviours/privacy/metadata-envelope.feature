Feature: Capture strict metadata
  As a developer who cares about the privacy of my work
  I want FERRET to store lifecycle metadata only
  So that no prompt, response, tool argument, transcript path, or environment value is ever kept

  # Behaviour: FRT-003
  Scenario: A valid lifecycle event is captured and appears in events list
    Given FERRET is initialized with an empty local database
    When an adapter submits one schema-version-1.0 tool-completed event
    Then events list shows that one event with its opaque workspace and session identifiers
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

  # Behaviour: FRT-004
  Scenario: ferret capture refuses input over 16 KiB
    Given FERRET is initialized with an empty local database
    When an adapter submits an event of 16 KiB plus one byte
    Then capture rejects the complete event without storing a partial row
    And the diagnostic names no field and echoes no part of the input

  # Behaviour: FRT-005
  Scenario Outline: A raw harness payload yields only allowlisted metadata and no diagnostic echoes its content
    Given a raw <harness> <event> payload for the <tool> tool carrying <content>
    When capture-hook maps it through that harness's allowlist mapper
    Then one <event> event naming <tool> is stored with only allowlisted metadata
    And no part of the <content> reaches the store
    And any diagnostic about the payload names no value taken from it

    Examples:
      | harness     | event          | tool       | content                                             |
      | claude_code | tool.completed | Read       | prompt text, tool arguments, and environment values |
      | codex       | tool.completed | view_image | a 1 MiB base64 image                                |

  # Behaviour: FRT-059
  Scenario: A payload over 64 MiB is refused and the hook still exits 0
    Given an initialized store and a raw harness payload larger than 64 MiB
    When capture-hook maps it through that harness's allowlist mapper
    Then it stores no event and writes nothing to either stream and exits 0

  # Behaviour: FRT-055
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

  # Behaviour: FRT-046
  # Behaviour: FRT-055
  Scenario: Reject an unknown capture field
    Given FERRET is initialized with an empty local database
    When an adapter submits an otherwise valid event with a property the schema does not define
    Then capture rejects the complete event without storing a partial row
    And the diagnostic names no field and echoes neither the unknown property name nor its value

  # Behaviour: FRT-006
  # Behaviour: FRT-056
  Scenario Outline: Capture only the lifecycle fact a Command Code hook reports
    Given an initialized store and a Command Code <hook> payload carrying private content
    When capture-hook receives the registered <event> event
    Then it silently stores one <event> event naming <tool>
    And the event reports outcome <outcome> with visibility <visibility>
    And the store contains no private content or inferred lifecycle metadata

    Examples:
      | hook        | event           | tool      | outcome        | visibility     |
      | SessionStart | session.started | none      | not_applicable | not_applicable |
      | PreToolUse   | tool.started    | read_file | not_applicable | not_applicable |
      | PostToolUse  | tool.completed  | read_file | unknown        | unknown        |

  Scenario Outline: Refuse unsupported or unusable Command Code hook input silently
    Given an initialized store and a Command Code payload with <condition>
    When capture-hook receives the registered <event> event
    Then it silently stores no event

    Examples:
      | condition             | event           |
      | an end-of-turn Stop   | session.ended   |
      | an unknown event      | tool.failed     |
      | a mismatched hook     | tool.started    |
      | a missing session     | tool.started    |
      | a relative directory  | tool.started    |
      | malformed JSON        | tool.started    |
