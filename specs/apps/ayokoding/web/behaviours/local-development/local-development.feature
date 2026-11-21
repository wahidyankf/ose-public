Feature: Independent local development

  As a developer working on the learning site
  I want the rewrite to run beside the existing site
  So that both implementations and content work can progress independently

  # Behaviour: AYB-001
  Scenario: The web app serves its entry pages on port 3102 by default
    When the rewrite starts without a port override
    Then the rewrite serves its bilingual entry pages on port 3102

  # Behaviour: AYB-003
  Scenario: A prefixed port override changes only the rewrite listener
    Given AYOKODING_WEB_PORT is set to an available valid port
    When the rewrite starts
    Then the rewrite listens on that port
    And the existing site's configured port remains unchanged

  # Behaviour: AYB-002
  Scenario: An explicit port flag wins over the prefixed environment value
    Given AYOKODING_WEB_PORT contains one valid port
    And the rewrite launcher receives a different valid port through its explicit port flag
    When the rewrite starts
    Then it listens on the explicit flag's port
    And it does not listen on the environment value's port

  # Behaviour: AYB-004
  Scenario: A generic PORT variable does not retarget the rewrite
    Given only the generic PORT variable contains a different valid port
    When the rewrite starts without a prefixed override or explicit port flag
    Then the rewrite listens on port 3102

  # Behaviour: AYB-010
  Scenario: An invalid port override fails before accepting requests
    Given AYOKODING_WEB_PORT is set to an invalid port value
    When the rewrite starts
    Then startup fails with a diagnostic naming AYOKODING_WEB_PORT
    And no rewrite listener starts on a fallback port

  Scenario: Playwright owns an isolated local rewrite server
    Given the existing site and the rewrite development server are running
    When the rewrite browser acceptance suite starts
    Then it starts its own Go server on port 3191
    And it leaves both development servers running after the suite finishes

  Scenario: Browsing course pages leaves the content files unchanged
    Given the shared Markdown and manifests have recorded byte hashes
    When a developer starts the rewrite and browses its course pages
    Then the Markdown and manifest byte hashes remain unchanged

  # Behaviour: AYB-005
  # Behaviour: AYB-006
  Scenario: AYOKODING_WEB_CONTENT_DIR and AYOKODING_WEB_MANIFESTS_DIR point the app at another corpus
    Given AYOKODING_WEB_CONTENT_DIR and AYOKODING_WEB_MANIFESTS_DIR name another corpus root
    When the rewrite starts
    Then the rewrite serves its pages and course paths from that corpus

  # Behaviour: AYB-032
  # Behaviour: AYB-033
  # Behaviour: AYB-034
  Scenario: Search, benchmark, and calculator fragments under /htmx update results without a full page load
    When a reader requests the search, benchmark, and calculator fragments
    Then each fragment returns results without the page layout

  # Behaviour: AYB-029
  # Behaviour: AYB-030
  Scenario Outline: Static assets and the favicon are served; an unknown asset returns 404
    When a reader requests the asset "<path>"
    Then the asset responds with status "<status>"

    Examples:
      | path                       | status |
      | /favicon.ico               | 200    |
      | /assets/css/site.css       | 200    |
      | /assets/js/progress.js     | 200    |
      | /assets/vendor/htmx.min.js | 200    |
      | /assets/js/unknown.js      | 404    |

  # Behaviour: AYB-011
  Scenario Outline: An unknown flag or fixture value stops startup with a message
    When the rewrite starts with the argument "<argument>"
    Then startup fails with a message naming "<naming>"

    Examples:
      | argument        | naming         |
      | --unknown-flag  | --unknown-flag |
      | --fixture=bogus | --fixture      |

  # Behaviour: AYB-009
  Scenario Outline: A fixture setting selects its canned corpus variant
    When the rewrite starts with the "<fixture>" fixture set by "<channel>"
    Then the course catalog answers with status "<status>"

    Examples:
      | fixture             | channel                | status |
      | parity              | --fixture flag         | 200    |
      | unavailable-catalog | AYOKODING_WEB_FIXTURE  | 500    |
