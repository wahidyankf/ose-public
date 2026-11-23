Feature: Button component

  As a developer using the web-ui design system
  I want the Button component to render correctly with all variants, sizes, and states
  So that I can build accessible and consistent user interfaces

  # Behaviour: WUI-002
  Scenario: Renders with default variant and size
    When the Button is rendered with label "Click me"
    Then the button element should be present in the document
    And the button should have data-variant "default"
    And the button should have data-size "default"

  # Behaviour: WUI-002
  Scenario Outline: Each button variant is marked with its name
    When I render a Button with variant "<variant>"
    Then the button should have data-variant "<variant>"

    Examples:
      | variant     |
      | default     |
      | destructive |
      | outline     |
      | secondary   |
      | ghost       |
      | link        |
      | teal        |
      | sage        |

  # Behaviour: WUI-002
  Scenario Outline: Each button size is marked with its name
    When I render a Button with size "<size>"
    Then the button should have data-size "<size>"

    Examples:
      | size    |
      | default |
      | xs      |
      | sm      |
      | lg      |
      | xl      |
      | icon    |
      | icon-xs |
      | icon-sm |
      | icon-lg |

  # Behaviour: WUI-002
  Scenario: Supports disabled state
    When the Button is rendered as disabled with label "Disabled"
    Then the button element should have the disabled attribute

  # Behaviour: WUI-002
  Scenario: Renders as child element when asChild is true
    When the Button is rendered with asChild wrapping an anchor to "/test" with label "Link Button"
    Then a link element with label "Link Button" should be present
    And the link should have href "/test"

  # Behaviour: WUI-002
  Scenario: Has no accessibility violations
    When the Button is rendered with label "Accessible Button"
    Then the button should have no accessibility violations
