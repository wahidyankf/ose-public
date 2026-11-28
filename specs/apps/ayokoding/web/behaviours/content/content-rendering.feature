Feature: Shared learning content rendering

  As a learner reading lessons
  I want the authored content and its interactive formats to remain intact
  So that changing the application framework does not change the lesson

  Background:
    Given the app is running

  Scenario: A section lists its pages by authored title and order
    Given a section contains published pages with valid titles, slugs, and weights
    When a reader opens that section
    Then page titles and links match their authored metadata
    And the pages follow the established weight and title ordering

  # Behaviour: AYB-055
  Scenario: A page with invalid metadata is not published
    Given a Markdown page has invalid required frontmatter
    When the content corpus is loaded
    Then that page is excluded from the published catalog
    And the developer receives a diagnostic identifying the invalid source

  Scenario: Tables, task lists, and details render with article styling
    Given a lesson contains tables, task lists, raw details markup, and nested headings
    When a reader opens that lesson
    Then those authored structures render with the established article styling

  Scenario: A page has one title heading and an ordered outline
    Given a lesson contains tables, task lists, raw details markup, and nested headings
    When a reader opens that lesson
    Then the page has one title heading with a normalized body outline

  Scenario: The table of contents links to body headings
    Given a lesson contains tables, task lists, raw details markup, and nested headings
    When a reader opens that lesson
    Then the table of contents links to stable body heading anchors

  # Behaviour: AYB-048
  Scenario Outline: Supported shortcodes remain interactive content
    Given a lesson contains a "<format>" shortcode fixture
    When a reader opens the fixture and activates its supported controls
    Then the "<result>" is available to the reader

    Examples:
      | format  | result                               |
      | callout | labeled admonition and authored body |
      | tabs    | selected tab's authored panel        |
      | steps   | ordered numbered learning steps      |
      | youtube | responsive video iframe              |

  Scenario: Relative Markdown links resolve from a section index
    Given a section index contains a relative Markdown link with a heading fragment
    When a reader follows that link
    Then the destination is resolved relative to that section's directory
    And the reader reaches the intended heading in the same locale

  # Behaviour: AYB-050
  Scenario: Copying a code block yields its exact source text
    Given a lesson contains annotated fenced code
    When a reader copies that code block
    Then the clipboard contains its exact source text and newlines

  Scenario: A code block shows its language label
    Given a lesson contains annotated fenced code
    When a reader opens that lesson
    Then the code block shows its language label and readable highlighting

  # Behaviour: AYB-049
  Scenario Outline: Math and diagrams render their authored meaning
    Given a lesson contains a "<format>" fixture
    When a reader opens the lesson
    Then the reader sees "<result>"
    And the source notation is not presented as the rendered result

    Examples:
      | format        | result                      |
      | inline math   | inline mathematical notation |
      | display math  | display mathematical notation |
      | Mermaid       | an accessible SVG diagram   |

  Scenario: Inline code wraps within the article on a phone
    Given a lesson contains a long inline token and a wide fenced code block
    When a reader opens it at 375 pixels wide
    Then inline code wraps within the article

  # Behaviour: AYB-050
  Scenario: A wide code block scrolls inside the article on a phone
    Given a lesson contains a long inline token and a wide fenced code block
    When a reader opens it at 375 pixels wide
    Then the fenced block scrolls internally without widening the document
