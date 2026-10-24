Feature: The legacy-to-course mapping is complete and mechanically checkable

  As plan 14's author
  I want one table that resolves every legacy file's disposition and redirect destination
  So that I can delete learn/legacy and repoint its links without re-deriving the classification

  # Exemption(integration): the scenario reads committed content and mapping files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every legacy file is matched by exactly one mapping row
  @integration-exempt
  # Exemption(e2e): mapping completeness is a property of committed files, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every legacy file is matched by exactly one mapping row
  @e2e-exempt
  Scenario: Every legacy file is matched by exactly one mapping row
    Given every Markdown file under apps/ayokoding-www/content/en/learn/legacy
    And every row of syllabus/legacy-to-course-mapping.md
    When each legacy file's path is matched against every row's Legacy path field
    Then every legacy file matches exactly one row
    And every row's Disposition is covered, new, or obsolete

  # Exemption(integration): the scenario reads committed mapping and course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every mapping row's target resolves to a real course or a dash
  @integration-exempt
  # Exemption(e2e): target resolution is a property of committed files, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every mapping row's target resolves to a real course or a dash
  @e2e-exempt
  Scenario: Every mapping row's target resolves to a real course or a dash
    Given every row of syllabus/legacy-to-course-mapping.md
    When a row's Disposition is covered or new
    Then every slug in its Target field is a real course directory under apps/ayokoding-www/content/en/learn/courses
    And when a row's Disposition is obsolete its Target field is exactly a dash

  # Exemption(integration): the scenario reads committed content files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / learn/legacy is untouched by this plan
  @integration-exempt
  # Exemption(e2e): a file-tree diff is not observable at a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / learn/legacy is untouched by this plan
  @e2e-exempt
  Scenario: learn/legacy is untouched by this plan
    Given this plan's branch diffed against the commit where plans 01 to 09 merged
    When the diff is filtered to apps/ayokoding-www/content/en/learn/legacy
    Then the filtered diff is empty
