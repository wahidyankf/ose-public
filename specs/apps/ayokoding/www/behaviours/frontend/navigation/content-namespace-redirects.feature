Feature: Content namespace redirects

  As a reader following a stale /c/-namespaced bookmark
  I want the URL to permanently redirect to its bare, de-namespaced location
  So that bookmarks and external links continue to resolve after de-namespacing (DD-48)

  Background:
    Given the app is running

  # Behaviour: AYW-033
  Scenario: A /c/-namespaced English learn URL permanently redirects to its bare URL
    When a raw HTTP GET is made to "/en/c/learn/software-engineering" with redirects disabled
    Then the response status should be 308
    And the response Location header should equal "/en/learn/software-engineering"

  Scenario: A /c/-namespaced Indonesian belajar URL permanently redirects to its bare URL
    When a raw HTTP GET is made to "/id/c/belajar/ikhtisar" with redirects disabled
    Then the response status should be 308
    And the response Location header should equal "/id/belajar/ikhtisar"

  Scenario Outline: top-level pages are not redirected
    When a visitor navigates to "<url>"
    Then the page should load successfully
    And the current URL should not contain "/c/"

    Examples:
      | url                      |
      | /en/about-ayokoding      |
      | /id/syarat-dan-ketentuan |
      | /en/tools                |
