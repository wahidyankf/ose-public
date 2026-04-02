Feature: Card component

  As a developer using the ts-ui design system
  I want the Card component to render correctly with all sub-components
  So that I can build consistent content containers

  Scenario: Renders card with header, title, description, content, and footer
    Given the Card is rendered with title "Card Title", description "Card description text", content "Card content here", and footer "Card footer here"
    Then the card title "Card Title" should have data-slot "card-title"
    And the card description "Card description text" should have data-slot "card-description"
    And the card content "Card content here" should have data-slot "card-content"
    And the card footer "Card footer here" should have data-slot "card-footer"

  Scenario: Has no accessibility violations
    Given the Card is rendered with title "Card Title", description "Card description text", content "Card content here", and footer "Card footer here"
    Then the card should have no accessibility violations
