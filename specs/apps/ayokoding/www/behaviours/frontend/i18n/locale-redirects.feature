Feature: Canonical locale entry redirects

  As a reader visiting AyoKoding
  I want locale entry URLs to resolve to one canonical lowercase URL
  So that links and caches do not split across equivalent addresses

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The root URL enters the default locale
  @integration-exempt
  Scenario: The root URL enters the default locale
    Given a visitor requests the root URL
    When locale redirects are applied
    Then the visitor reaches the default locale at "/en"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Uppercase locale URLs redirect to lowercase canonical URLs
  @integration-exempt
  Scenario Outline: Uppercase locale URLs redirect to lowercase canonical URLs
    Given a visitor requests the uppercase locale URL "<source_url>"
    When locale redirects are applied
    Then the visitor is permanently redirected to "<destination_url>"

    Examples:
      | source_url              | destination_url          |
      | /EN                     | /en                      |
      | /ID                     | /id                      |
      | /EN/learn/courses       | /en/learn/courses        |
      | /ID/learn/courses       | /id/learn/courses        |
