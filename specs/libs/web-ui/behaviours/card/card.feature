Feature: Card component

  As a developer using the web-ui design system
  I want the Card component to render correctly with all sub-components
  So that I can build consistent content containers

  # Behaviour: WUI-005
  Scenario: A card shows its title, description, content, and footer
    When the Card is rendered with title "Card Title", description "Card description text", content "Card content here", and footer "Card footer here"
    Then the card shows its title, description, content, and footer in that order

  # Behaviour: WUI-005
  Scenario: Has no accessibility violations
    When the Card is rendered with title "Card Title", description "Card description text", content "Card content here", and footer "Card footer here"
    Then the card should have no accessibility violations
