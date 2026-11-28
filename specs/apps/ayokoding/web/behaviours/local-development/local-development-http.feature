Feature: Independent local development over HTTP

  As a developer working on the learning site
  I want the rewrite to run beside the existing site
  So that both implementations and content work can progress independently

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

  # Behaviour: AYB-057
  @real-corpus
  Scenario: A default start serves the real content corpus
    Given no fixture is selected
    When the rewrite starts with no fixture flag or fixture variable
    Then the lesson "/en/learn/courses/just-enough-python/learning/beginner" answers with status "200"
    And the lesson "/en/learn/courses/go-basics/learning/hello-world" answers with status "404"

  # Behaviour: AYB-058
  @fixture
  Scenario: A fixture is served only when one is selected
    Given the "parity" fixture is selected
    When a reader requests the lesson "/en/learn/courses/go-basics/learning/hello-world"
    Then the lesson answers with status "200"
