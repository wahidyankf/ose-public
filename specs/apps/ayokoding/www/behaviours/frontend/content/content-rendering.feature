Feature: Content Rendering

  As a reader visiting AyoKoding
  I want page content to render correctly with all supported formats
  So that I can read articles, code, diagrams, and interactive elements as intended

  Background:
    Given the app is running

  # Behaviour: AYW-025
  Scenario: Body text, headings, and paragraphs are visually distinct and evenly spaced
    When a visitor opens a content page with prose body text
    Then the body text should have prose typography classes applied
    And headings should be visually distinct from body text
    And paragraph spacing should be consistent

  Scenario: Code blocks show highlighted tokens, a language label, and a monospace font
    When a visitor opens a content page containing a fenced code block
    Then the code block should display with syntax-highlighted tokens
    And the language label should be shown above the code block
    And the block should use a monospace font

  Scenario: A callout renders as a labelled box with its icon and text
    When a visitor opens a content page containing a callout shortcode
    Then the callout should render as an admonition block
    And the admonition should display the appropriate icon and label for its type
    And the callout body text should be visible inside the admonition

  Scenario: Tabs shortcode renders as tabbed panels
    When a visitor opens a content page containing a tabs shortcode
    Then the tabs should render as a tab bar with clickable tab labels
    And the visitor clicks a tab label
    And the corresponding panel content should become visible
    And the other panels should be hidden

  # Exemption(integration): the assertion reads the rendered page in a browser, and the integration project runs in node with no DOM or browser driver, so the end-to-end project supplies that browser; alternative-proof: ayokoding-www-fe-e2e:test:e2e / YouTube shortcode renders as a responsive iframe embed
  @integration-exempt
  # Exemption(e2e): the published content catalogue contains no YouTube shortcode instance that can be selected through the public site boundary; alternative-proof: ayokoding-www:test:unit / YouTube shortcode renders as a responsive iframe embed
  @e2e-exempt
  Scenario: YouTube shortcode renders as a responsive iframe embed
    When a visitor opens a content page containing a YouTube shortcode
    Then a responsive iframe embed should be visible
    And the iframe src should point to the YouTube embed URL
    And the embed should maintain a 16:9 aspect ratio

  Scenario: Steps shortcode renders as a numbered step list
    When a visitor opens a content page containing a steps shortcode
    Then the steps should render as an ordered list of numbered items
    And each step should display its number prominently
    And the step content should be indented beneath its number

  Scenario: Inline math renders as formatted notation, not raw LaTeX
    When a visitor opens a content page containing an inline math expression delimited by $...$
    Then the expression should render as formatted math notation inline with surrounding text
    And the rendered math should not display raw LaTeX source

  Scenario: Block math renders as a centred display, not raw LaTeX
    When a visitor opens a content page containing a block math expression delimited by $$...$$
    Then the expression should render as a centered display math block
    And the rendered math should not display raw LaTeX source

  # Behaviour: AYW-026
  Scenario: Mermaid diagram renders as an SVG
    When a visitor opens a content page containing a Mermaid code block
    Then the diagram should render as an inline SVG element
    And the raw Mermaid source should not be visible to the visitor

  # Exemption(integration): the assertion reads the rendered page in a browser, and the integration project runs in node with no DOM or browser driver, so the end-to-end project supplies that browser; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Mermaid source is keyboard reachable until a diagram shows
  @integration-exempt
  # Exemption(e2e): a browser run cannot hold the renderer pending or make it fail on demand without injected fault control, so the boundary is the unit tier; alternative-proof: ayokoding-www:test:unit / Mermaid source is keyboard reachable until a diagram shows
  @e2e-exempt
  Scenario Outline: Mermaid source is keyboard reachable until a diagram shows
    Given a visitor opens a content page with a Mermaid code block between two controls
    And the diagram <state>
    When the visitor presses Tab to reach the control before the code block
    And the visitor presses Tab again
    Then the Mermaid source should have keyboard focus
    When the visitor presses Tab once more
    Then focus should move to the control after the code block

    Examples:
      | state              |
      | is still rendering |
      | fails to render    |

  Scenario: The Mermaid source leaves keyboard focus order once the diagram renders
    When a visitor opens a content page containing a Mermaid code block
    And the diagram should render as an inline SVG element
    Then the Mermaid source should be removed from keyboard focus order

  # Exemption(integration): the assertion reads the rendered page in a browser, and the integration project runs in node with no DOM or browser driver, so the end-to-end project supplies that browser; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The focused Mermaid source has a visible indicator in light and dark themes
  @integration-exempt
  # Exemption(e2e): a browser run cannot hold the renderer pending on demand without injected fault control, so the boundary is the unit tier; alternative-proof: ayokoding-www:test:unit / The focused Mermaid source has a visible indicator in light and dark themes
  @e2e-exempt
  Scenario: The focused Mermaid source has a visible indicator in light and dark themes
    Given a visitor opens a content page with a Mermaid code block
    And the diagram is still rendering
    When the visitor moves keyboard focus to the Mermaid source
    Then the Mermaid source should show an outline drawn in the foreground colour
    And that outline should contrast with the code surface by at least 3 to 1 in both themes

  Scenario: A details disclosure reveals its answer when opened
    When a visitor opens a content page containing a raw HTML details disclosure
    Then the HTML elements should render in the browser as expected
    And the disclosure should reveal its authored answer when opened

  Scenario: Section headings render as headings, not as links
    When a visitor opens a content page with section headings
    Then each section heading is shown in the heading text colour without an underline
    And the heading still links to its own anchor

  Scenario: Inline code renders without literal backticks
    When a visitor opens a content page containing inline code
    Then the inline code shows no backtick characters before or after it
    And the inline code uses the surrounding text's font weight

  # UWT-005 fix (phase-8 rule-15 retest): a long unbreakable inline code token must never force
  # the page to pan horizontally on a phone.
  Scenario: Course content never scrolls the document horizontally at 375
    Given a content page containing a long inline code token on a phone-wide article
    When its prose renders at a 375px viewport
    Then the inline code chips break within themselves instead of widening the page
    And the fenced code blocks stay confined to the article with an internal horizontal scroll

  # Exemption(integration): the fallback is the error boundary of a route inside the running Next.js app, and the integration project does not start that app, so no route can throw into it there; alternative-proof: ayokoding-www:test:unit / A rendering failure shows "Something went wrong" with a Try again button
  @integration-exempt
  # Exemption(e2e): no published page or e2e fixture makes the renderer throw, so the public site offers no failing route to select; alternative-proof: ayokoding-www:test:unit / A rendering failure shows "Something went wrong" with a Try again button
  @e2e-exempt
  # Behaviour: AYW-027
  Scenario: A rendering failure shows "Something went wrong" with a Try again button
    Given a content page fails while rendering
    Then the reader sees "Something went wrong" with a Try again button
    When the reader selects Try again
    Then the page is rendered again
