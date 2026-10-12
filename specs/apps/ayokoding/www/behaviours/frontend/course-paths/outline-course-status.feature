Feature: Outline course status

  As a reader following a learning path
  I want unfinished courses marked as outlines
  So that I know before I open a course that it is not yet complete

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / Course status accepts only the outline value
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Course status accepts only the outline value
  @e2e-exempt
  Scenario: Course status accepts only the outline value
    Given course frontmatter declares a status value
    When the frontmatter schema parses it
    Then the value "outline" is accepted
    And an absent status is accepted
    And any other value is rejected

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / Every course frontmatter parses so no course page is silently dropped
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every course frontmatter parses so no course page is silently dropped
  @e2e-exempt
  Scenario: Every course frontmatter parses so no course page is silently dropped
    Given the published course library under content/en/learn/courses
    When every course _index.md is parsed with the frontmatter schema
    Then every course parses without error

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A course under one thousand words is marked as an outline
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A course under one thousand words is marked as an outline
  @e2e-exempt
  Scenario: A course under one thousand words is marked as an outline
    Given the published course library under content/en/learn/courses
    When the words of every markdown file in each course directory are counted
    Then every course with fewer than 1000 words declares status outline

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / An outline course carries an Outline badge wherever a path lists it
  @integration-exempt
  Scenario: An outline course carries an Outline badge wherever a path lists it
    Given a fixture path lists a course whose frontmatter declares status outline
    When a reader opens that path's landing page and then a course in that path
    Then the outline course shows a text badge reading "Outline" in the syllabus
    And the same course shows the "Outline" badge in the path rail
    And a course without status outline shows no badge
