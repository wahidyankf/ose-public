Feature: Course content hygiene

  As a reader of AyoKoding courses
  I want course titles without stale numbers and sources without internal verification notes
  So that course pages read cleanly and stay honest about uncertain facts

  # Behaviour: AYW-031
  Scenario: The courses list page shows no course title with a leading catalogue number
    Given the published English course library
    When its course titles are read
    Then no course title starts with a catalogue number or a pass number
    And the course list page shows every course title without a leading number

  # Exemption(integration): the scenario reads the authored course source files on disk, which the integration project does not serve as pages, so the unit tier walks them directly; alternative-proof: ayokoding-www:test:unit / No course page shows an accuracy note or internal confidence tag
  @integration-exempt
  # Exemption(e2e): the scenario reads authored source files, which the served site does not expose, so no browser boundary observes them; alternative-proof: ayokoding-www:test:unit / No course page shows an accuracy note or internal confidence tag
  @e2e-exempt
  Scenario: No course page shows an accuracy note or internal confidence tag
    Given the published English course library
    When its course pages and example files are read
    Then no course page shows an "Accuracy notes" section, an "Accuracy note" label, or an internal confidence tag

  # Exemption(integration): the scenario reads the authored course source files on disk, which the integration project does not serve as pages, so the unit tier walks them directly; alternative-proof: ayokoding-www:test:unit / Cited sources sit under a References heading
  @integration-exempt
  # Exemption(e2e): the scenario reads authored source files, which the served site does not expose, so no browser boundary observes them; alternative-proof: ayokoding-www:test:unit / Cited sources sit under a References heading
  @e2e-exempt
  Scenario: Cited sources sit under a References heading
    Given the published English course library
    When its course pages and example files are read
    Then a course that cites sources shows them under a "References" heading
