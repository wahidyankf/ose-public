Feature: Shared learning content rendering

  As a learner reading lessons
  I want the authored content and its interactive formats to remain intact
  So that changing the application framework does not change the lesson

  Background:
    Given the app is running

  Scenario: An ordinary content request contains readable server-rendered HTML
    Given a published Markdown lesson exists in the shared corpus
    When a reader requests its route without running browser scripts
    Then the response contains the lesson title and readable article body
    And the response does not depend on a Next.js build artifact

  Scenario: Frontmatter preserves content identity and section order
    Given a section contains published pages with valid titles, slugs, and weights
    When a reader opens that section
    Then page titles and links match their authored metadata
    And the pages follow the established weight and title ordering

  Scenario: Draft content stays hidden unless draft viewing is enabled
    Given a lesson is marked as a draft
    And draft viewing is disabled
    When a reader requests the lesson or searches the corpus
    Then the lesson is absent from the public results
    And its direct route returns not found

  Scenario: Invalid frontmatter does not publish a malformed page
    Given a Markdown page has invalid required frontmatter
    When the content corpus is loaded
    Then that page is excluded from the published catalog
    And the developer receives a diagnostic identifying the invalid source

  Scenario: Rich prose keeps its structure and accessible outline
    Given a lesson contains tables, task lists, raw details markup, and nested headings
    When a reader opens that lesson
    Then those authored structures render with the established article styling
    And the page has one title heading with a normalized body outline
    And the table of contents links to stable body heading anchors

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

  Scenario: Copying highlighted code preserves its original text
    Given a lesson contains annotated fenced code
    When a reader copies that code block
    Then the clipboard contains its exact source text and newlines
    And the code block shows its language label and readable highlighting

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

  Scenario: Long code stays inside the article on a phone
    Given a lesson contains a long inline token and a wide fenced code block
    When a reader opens it at 375 pixels wide
    Then inline code wraps within the article
    And the fenced block scrolls internally without widening the document

  Scenario: A missing page returns the locale's not-found experience
    When a reader requests a nonexistent content route in a supported locale
    Then the response status is 404
    And the reader sees a localized not-found page with usable navigation
