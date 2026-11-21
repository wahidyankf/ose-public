Feature: Outline course status

  As a reader following a learning path
  I want unfinished courses marked as outlines
  So that I know before I open a course that it is not yet complete

  # Behaviour: AYW-144
  Scenario: The path syllabus marks an outline course with an Outline badge
    Given a fixture path lists a course whose frontmatter declares status outline
    When a reader opens that path's landing page
    Then the outline course shows a text badge reading "Outline" in the syllabus
    And a course without status outline shows no badge in the syllabus

  # Behaviour: AYW-144
  Scenario: The path rail marks an outline course with an Outline badge
    Given a fixture path lists a course whose frontmatter declares status outline
    When a reader opens a course in that path
    Then the outline course shows a text badge reading "Outline" in the path rail
    And a course without status outline shows no badge in the path rail
