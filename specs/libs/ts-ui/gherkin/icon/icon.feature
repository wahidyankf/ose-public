Feature: Icon component

  Scenario: Known icon renders SVG
    Given I render an Icon with name "check"
    Then the SVG element should be present

  Scenario: Unknown name renders fallback circle
    Given I render an Icon with name "nonexistent-icon"
    Then the SVG should contain a fallback circle

  Scenario: Decorative icon has aria-hidden
    Given I render an Icon with name "home" without aria-label
    Then the icon should have aria-hidden set to true

  Scenario: Icon with aria-label has accessible name
    Given I render an Icon with name "home" and aria-label "Home"
    Then the icon should have role "img" and aria-label "Home"
