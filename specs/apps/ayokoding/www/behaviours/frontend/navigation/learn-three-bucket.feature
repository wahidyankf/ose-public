Feature: Learn-section three-bucket IA

  As a reader browsing the learn section
  I want the learn section to expose exactly three structural buckets and old
  domain URLs to redirect to their legacy address
  So that the section stays navigable while older material is kept for
  reference (DD-40/DD-41/DD-42/DD-48)

  Background:
    Given the app is running

  @specs
  # Behaviour: AYW-032
  Scenario: The Learn section offers only Paths, Courses, and Legacy
    When the content tree under the en learn section is inspected
    Then its only structural buckets are paths, courses, and legacy
    And no former subject domain remains as a direct child of the learn section

  Scenario Outline: legacy domain URLs redirect to the legacy bucket
    When a visitor navigates to "/en/learn/<domain>/overview"
    Then the current URL should contain "/en/learn/legacy/<domain>/overview"
    And the response status should not be a client or server error

    Examples:
      | domain                  |
      | software-engineering    |
      | artificial-intelligence |
      | information-security    |
      | personal-development    |
      | it-governance           |
      | business                |

  Scenario Outline: A stale /c-bookmarked legacy domain URL redirects to its legacy address in two hops
    When a visitor navigates to "/en/c/learn/<domain>/overview"
    Then the current URL should contain "/en/learn/legacy/<domain>/overview"
    And the response status should not be a client or server error

    Examples:
      | domain                  |
      | software-engineering    |
      | artificial-intelligence |
      | information-security    |
      | personal-development    |
      | it-governance           |
      | business                |

  Scenario: A historical learn-reorg source chains through to its legacy address
    When a visitor navigates to "/en/learn/human/overview"
    Then the current URL should contain "/en/learn/legacy/personal-development/overview"
    And the response status should not be a client or server error

  Scenario Outline: canonical URLs are not rewritten to legacy
    When a visitor navigates to "<url>"
    Then the current URL should not contain "/legacy/"

    Examples:
      | url                                |
      | /en/learn/courses/just-enough-nvim |
      | /en/learn/paths/careers            |

  Scenario: The legacy redirect does not interfere with a re-homed fundamentally-strong course URL
    When a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"
    Then the current URL should contain "/en/learn/courses/just-enough-python"

  Scenario: A deep legacy path keeps its sub-taxonomy verbatim
    When a visitor navigates to "/en/learn/software-engineering/programming-languages/python/by-example/advanced"
    Then the current URL should contain "/en/learn/legacy/software-engineering/programming-languages/python/by-example/advanced"
    And the response status should not be a client or server error
