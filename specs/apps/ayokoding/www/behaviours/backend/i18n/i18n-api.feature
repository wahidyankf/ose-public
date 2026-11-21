Feature: Internationalisation API

  As a web client
  I want to request content scoped to a specific locale
  So that readers receive content in their chosen language

  Background:
    Given the API is running

  Scenario Outline: Content is served in the requested locale
    Given a page exists at slug "<slug>" under locale "<locale>"
    When the client calls content.getBySlug with slug "<slug>"
    Then the response "frontmatter" should indicate locale "<locale>"
    And the response "html" should contain <language>-language content

    Examples:
      | locale | slug                                              | language   |
      | en     | en/learn/courses/just-enough-go/learning/beginner | English    |
      | id     | id/belajar/ikhtisar                               | Indonesian |

  # Behaviour: AYW-068
  Scenario: Requesting a slug prefixed with an invalid locale is rejected
    When the client calls content.getBySlug with slug "fr/learn/courses/just-enough-go/learning/beginner"
    Then the response should reject the invalid locale as a bad request
