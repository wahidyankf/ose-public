Feature: The catalog's course and category counts stay correct after migration

  As a content maintainer
  I want the catalog's hard-coded counts to match the real course corpus after this plan
  So that the catalog's own tests do not silently drift out of date

  # Exemption(integration): the scenario reads committed content and counts a real corpus, with no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / The total course count and every per-category count match the real corpus
  @integration-exempt
  # Exemption(e2e): a corpus count is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / The total course count and every per-category count match the real corpus
  @e2e-exempt
  Scenario: The total course count and every per-category count match the real corpus
    Given every course directory under apps/ayokoding-www/content/en/learn/courses
    When courses are counted in total and grouped by category
    Then the total is 230
    And each category's count matches the number of courses declaring that category
