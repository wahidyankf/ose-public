Feature: Content Rendering

  As a reader visiting AyoKoding
  I want page content to render correctly with all supported formats
  So that I can read articles, code, diagrams, and interactive elements as intended

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Markdown prose renders with proper formatting classes
  @integration-exempt
  Scenario: Markdown prose renders with proper formatting classes
    When a visitor opens a content page with prose body text
    Then the body text should have prose typography classes applied
    And headings should be visually distinct from body text
    And paragraph spacing should be consistent

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Code blocks render with syntax highlighting via Shiki
  @integration-exempt
  Scenario: Code blocks render with syntax highlighting via Shiki
    When a visitor opens a content page containing a fenced code block
    Then the code block should display with syntax-highlighted tokens
    And the language label should be shown above the code block
    And the block should use a monospace font

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Callout shortcode renders as an Alert admonition
  @integration-exempt
  Scenario: Callout shortcode renders as an Alert admonition
    When a visitor opens a content page containing a callout shortcode
    Then the callout should render as an admonition block
    And the admonition should display the appropriate icon and label for its type
    And the callout body text should be visible inside the admonition

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Tabs shortcode renders as tabbed panels
  @integration-exempt
  Scenario: Tabs shortcode renders as tabbed panels
    When a visitor opens a content page containing a tabs shortcode
    Then the tabs should render as a tab bar with clickable tab labels
    And the visitor clicks a tab label
    And the corresponding panel content should become visible
    And the other panels should be hidden

  # Exemption(integration): responsive YouTube embedding is pure rendered-DOM behaviour with no local resource boundary for Integration to exercise; alternative-proof: ayokoding-www:test:unit / YouTube shortcode renders as a responsive iframe embed
  @integration-exempt
  # Exemption(e2e): the published content catalogue contains no YouTube shortcode instance that can be selected through the public site boundary; alternative-proof: ayokoding-www:test:unit / YouTube shortcode renders as a responsive iframe embed
  @e2e-exempt
  Scenario: YouTube shortcode renders as a responsive iframe embed
    When a visitor opens a content page containing a YouTube shortcode
    Then a responsive iframe embed should be visible
    And the iframe src should point to the YouTube embed URL
    And the embed should maintain a 16:9 aspect ratio

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Steps shortcode renders as a numbered step list
  @integration-exempt
  Scenario: Steps shortcode renders as a numbered step list
    When a visitor opens a content page containing a steps shortcode
    Then the steps should render as an ordered list of numbered items
    And each step should display its number prominently
    And the step content should be indented beneath its number

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Inline math expression renders via KaTeX
  @integration-exempt
  Scenario: Inline math expression renders via KaTeX
    When a visitor opens a content page containing an inline math expression delimited by $...$
    Then the expression should render as formatted math notation inline with surrounding text
    And the rendered math should not display raw LaTeX source

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Block math expression renders via KaTeX
  @integration-exempt
  Scenario: Block math expression renders via KaTeX
    When a visitor opens a content page containing a block math expression delimited by $$...$$
    Then the expression should render as a centered display math block
    And the rendered math should not display raw LaTeX source

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Mermaid diagram renders as an SVG
  @integration-exempt
  Scenario: Mermaid diagram renders as an SVG
    When a visitor opens a content page containing a Mermaid code block
    Then the diagram should render as an inline SVG element
    And the raw Mermaid source should not be visible to the visitor

  # Exemption(integration): the pending state is produced by an injected in-process renderer, so the boundary has no local resource to exercise; alternative-proof: ayokoding-www:test:unit / Mermaid source stays keyboard reachable while its diagram is pending
  @integration-exempt
  # Exemption(e2e): a browser run cannot hold the renderer pending on demand without injected fault control, so the boundary is the unit tier; alternative-proof: ayokoding-www:test:unit / Mermaid source stays keyboard reachable while its diagram is pending
  @e2e-exempt
  Scenario: Mermaid source stays keyboard reachable while its diagram is pending
    Given a visitor opens a content page with a Mermaid code block between two controls
    And the diagram is still rendering
    When the visitor presses Tab to reach the control before the code block
    And the visitor presses Tab again
    Then the Mermaid source should have keyboard focus
    When the visitor presses Tab once more
    Then focus should move to the control after the code block

  # Exemption(integration): the failed state is produced by an injected in-process renderer, so the boundary has no local resource to exercise; alternative-proof: ayokoding-www:test:unit / Mermaid source stays keyboard reachable when its diagram fails to render
  @integration-exempt
  # Exemption(e2e): a browser run cannot make the renderer fail on demand without injected fault control, so the boundary is the unit tier; alternative-proof: ayokoding-www:test:unit / Mermaid source stays keyboard reachable when its diagram fails to render
  @e2e-exempt
  Scenario: Mermaid source stays keyboard reachable when its diagram fails to render
    Given a visitor opens a content page with a Mermaid code block between two controls
    When the diagram rendering fails
    And the visitor presses Tab to reach the control before the code block
    And the visitor presses Tab again
    Then the Mermaid source should have keyboard focus
    When the visitor presses Tab once more
    Then focus should move to the control after the code block

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The Mermaid source leaves keyboard focus order once the diagram renders
  @integration-exempt
  Scenario: The Mermaid source leaves keyboard focus order once the diagram renders
    When a visitor opens a content page containing a Mermaid code block
    And the diagram should render as an inline SVG element
    Then the Mermaid source should be removed from keyboard focus order

  # Exemption(integration): the pending state is produced by an injected in-process renderer, so the boundary has no local resource to exercise; alternative-proof: ayokoding-www:test:unit / The focused Mermaid source has a visible indicator in light and dark themes
  @integration-exempt
  # Exemption(e2e): a browser run cannot hold the renderer pending on demand without injected fault control, so the boundary is the unit tier; alternative-proof: ayokoding-www:test:unit / The focused Mermaid source has a visible indicator in light and dark themes
  @e2e-exempt
  Scenario: The focused Mermaid source has a visible indicator in light and dark themes
    Given a visitor opens a content page with a Mermaid code block
    And the diagram is still rendering
    When the visitor moves keyboard focus to the Mermaid source
    Then the Mermaid source should show an outline drawn in the foreground colour
    And that outline should contrast with the code surface by at least 3 to 1 in both themes

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Raw HTML details disclosure renders correctly
  @integration-exempt
  Scenario: Raw HTML details disclosure renders correctly
    When a visitor opens a content page containing a raw HTML details disclosure
    Then the HTML elements should render in the browser as expected
    And the disclosure should reveal its authored answer when opened

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Section headings render as headings, not as links
  @integration-exempt
  Scenario: Section headings render as headings, not as links
    When a visitor opens a content page with section headings
    Then each section heading is shown in the heading text colour without an underline
    And the heading still links to its own anchor

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Inline code renders without literal backticks
  @integration-exempt
  Scenario: Inline code renders without literal backticks
    When a visitor opens a content page containing inline code
    Then the inline code shows no backtick characters before or after it
    And the inline code uses the surrounding text's font weight

  # UWT-005 fix (phase-8 rule-15 retest): a long unbreakable inline code token must never force
  # the page to pan horizontally on a phone.
  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Course content never scrolls the document horizontally at 375
  @integration-exempt
  Scenario: Course content never scrolls the document horizontally at 375
    Given a content page containing a long inline code token on a phone-wide article
    When its prose renders at a 375px viewport
    Then the inline code chips break within themselves instead of widening the page
    And the fenced code blocks stay confined to the article with an internal horizontal scroll
