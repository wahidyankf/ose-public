Feature: Statically delivered content pages

  As a reader visiting AyoKoding
  I want content pages to remain cacheable with the correct document language
  So that courses load quickly in my selected locale

  Background:
    Given the app is running

  # Exemption(e2e): the scenario counts routes in the build output manifest, a file the served site does not expose, so no end-to-end boundary exists for that count; the served pages are checked by the cacheable-response scenario; alternative-proof: ayokoding-www:test:integration / A content page is prerendered at build time
  @e2e-exempt
  # Behaviour: AYW-028
  Scenario: A content page is prerendered at build time
    Given the ayokoding-www site is built and deployed
    When the build output manifest is inspected
    Then the prerendered route count is at least two thousand
    And the inspected content route is present in the static route manifest

  Scenario: A repeat request to a content page remains cacheable
    Given a visitor has already requested a course lesson URL
    When the same URL is requested again
    Then the response does not carry a no-store cache directive

  Scenario: Runtime tRPC endpoints retain their filesystem assets
    Given the ayokoding-www standalone package is running
    When navigation search and course-path data are requested through tRPC
    Then every runtime data endpoint responds successfully

  # Behaviour: AYW-029
  Scenario Outline: The document language reflects the localized page locale
    Given a visitor opens a localized page in the "<locale>" locale
    When the localized page renders
    Then the html element declares the "<language_code>" language code

    Examples:
      | locale | language_code |
      | en     | en            |
      | id     | id            |

  # Behaviour: AYW-030
  Scenario: Pages are served with security headers, including frame denial and a content security policy
    Given a visitor requests any page of the site
    Then the response refuses to be framed by other sites
    And the response declares a content security policy
