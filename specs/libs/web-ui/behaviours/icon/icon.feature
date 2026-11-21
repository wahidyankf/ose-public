Feature: Icon component

  # Behaviour: WUI-008
  Scenario: Known icon renders SVG
    When I render an Icon with name "check"
    Then the SVG element should be present

  # Behaviour: WUI-008
  Scenario: Unknown name renders fallback circle
    When I render an Icon with name "nonexistent-icon"
    Then the SVG should contain a fallback circle

  # Behaviour: WUI-008
  Scenario: Decorative icon has aria-hidden
    When I render an Icon with name "home" without aria-label
    Then the icon should have aria-hidden set to true

  # Behaviour: WUI-008
  Scenario: Icon with aria-label has accessible name
    When I render an Icon with name "home" and aria-label "Home"
    Then the icon should have role "img" and aria-label "Home"

  # Behaviour: WUI-037
  Scenario: Every name in IconName draws an icon, not the fallback circle
    When I render an Icon for every name in the IconName set
    Then each name draws its own icon instead of the fallback circle
