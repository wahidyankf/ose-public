Feature: Structural design token exports

  As a frontend developer
  I want web-ui-token to export the structural design tokens
  So that every app can consume a consistent color, spacing, radius, and typography scale

  # Behaviour: WUT-001
  # Behaviour: WUT-002
  # Behaviour: WUT-003
  # Behaviour: WUT-004
  # Exemption(e2e): the package owns no served origin, route, or deployed process, so the e2e level has no boundary of its own to reach; alternative-proof: web-ui-token:test:integration / tests/integration/tokens-on-disk.integration.test.ts
  @e2e-exempt
  Scenario: The package exports every structural token module
    Given the web-ui-token package
    When I import from "@open-sharia-enterprise/web-ui-token"
    Then "colorTokens" should be exported
    And "radius" should be exported
    And "spacing" should be exported
    And "typography" should be exported

  # Behaviour: WUT-005
  # Exemption(e2e): the package owns no served origin, route, or deployed process, so the e2e level has no boundary of its own to reach; alternative-proof: web-ui-token:test:integration / tests/integration/tokens-on-disk.integration.test.ts
  @e2e-exempt
  Scenario: Importing tokens.css defines the structural radius, neutral, muted, and destructive tokens
    Given the web-ui-token package
    When I import tokens.css
    Then tokens.css should define "--radius"
    And tokens.css should define "--color-background"
    And tokens.css should define "--color-muted"
    And tokens.css should define "--color-destructive"

  # Behaviour: WUT-006
  # Exemption(e2e): the package owns no served origin, route, or deployed process, so the e2e level has no boundary of its own to reach; alternative-proof: web-ui-token:test:integration / tests/integration/tokens-on-disk.integration.test.ts
  @e2e-exempt
  Scenario: The dark class or data-theme dark switches the neutral palette
    Given the web-ui-token package
    When I import tokens.css
    Then tokens.css should declare a dark variant for the dark class and data-theme dark
    And the dark palette should redefine "--color-background" with a different value

  # Behaviour: WUT-007
  # Exemption(e2e): the package owns no served origin, route, or deployed process, so the e2e level has no boundary of its own to reach; alternative-proof: web-ui-token:test:integration / tests/integration/tokens-on-disk.integration.test.ts
  @e2e-exempt
  Scenario: Importing organiclever.css activates the warm palette
    Given the web-ui-token package
    When I import organiclever.css
    Then organiclever.css should define six hues in three tints
    And organiclever.css should define a warm neutral scale
    And organiclever.css should set the primary colour to the sage hue

  # Behaviour: WUT-009
  # Exemption(e2e): the package owns no served origin, route, or deployed process, so the e2e level has no boundary of its own to reach; alternative-proof: web-ui-token:test:integration / tests/integration/tokens-on-disk.integration.test.ts
  @e2e-exempt
  Scenario: Each colorTokens name is a custom property defined by tokens.css
    Given the web-ui-token package
    When I compare colorTokens with tokens.css
    Then every colorTokens name should be defined as a custom property in tokens.css

  # Behaviour: WUT-010
  # Exemption(e2e): the package owns no served origin, route, or deployed process, so the e2e level has no boundary of its own to reach; alternative-proof: web-ui-token:test:integration / tests/integration/tokens-on-disk.integration.test.ts
  @e2e-exempt
  Scenario: The radius, spacing, and typography values match the documented scales
    Given the web-ui-token package
    When I compare the radius, spacing, and typography values with the documented scales
    Then every value should match its documented scale
