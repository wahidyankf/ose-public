Feature: Badge component

  # Behaviour: WUI-024
  Scenario: A default badge shows its text on the solid hue colour
    When I render a Badge with text "workout"
    Then I see text "workout"
    And the badge has solid background

  # Behaviour: WUI-024
  Scenario: An outline badge shows the honey wash and honey border
    When I render a Badge variant "outline" hue "honey"
    Then the badge has honey wash background
    And the badge has honey border

  # Behaviour: WUI-024
  Scenario: A secondary badge uses the secondary colour
    When I render a Badge variant "secondary"
    Then the badge has background color from --color-secondary

  # Behaviour: WUI-024
  Scenario: A destructive badge uses the destructive colour
    When I render a Badge variant "destructive"
    Then the badge uses destructive colors

  # Behaviour: WUI-024
  Scenario: An md badge has 13px text and wider padding than sm
    When I render a Badge with size "md"
    Then the badge has class containing "text-[13px]"
    And the badge has wider padding than an sm badge
