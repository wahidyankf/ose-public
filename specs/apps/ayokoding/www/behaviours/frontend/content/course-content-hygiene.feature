Feature: Course content hygiene

  As a reader of AyoKoding courses
  I want course titles without stale numbers and sources without internal verification notes
  So that course pages read cleanly and stay honest about uncertain facts

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / No course title carries a catalogue number
  @integration-exempt
  Scenario: No course title carries a catalogue number
    Given the published English course library
    When its course titles are read
    Then no course title starts with a catalogue number or a pass number
    And the course list page shows every course title without a leading number

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Courses cite sources in a References section without internal verification tags
  @integration-exempt
  Scenario: Courses cite sources in a References section without internal verification tags
    Given the published English course library
    When its course pages and example files are read
    Then no file contains an "Accuracy notes" section, an "Accuracy note" label, or an internal confidence tag
    And a course that cites sources shows them under a "References" heading
