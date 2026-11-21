Feature: Separator

  # Behaviour: WUI-030
  Scenario Outline: A separator renders horizontal or vertical and decorative by default
    Given a separator with orientation "<orientation>" and decorative "<decorative>"
    Then the separator has the orientation "<orientation>"
    And the separator has the role "<role>"

    Examples:
      | orientation | decorative | role      |
      | horizontal  | true       | none      |
      | vertical    | true       | none      |
      | horizontal  | false      | separator |
