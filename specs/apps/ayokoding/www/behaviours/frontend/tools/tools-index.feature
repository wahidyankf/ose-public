Feature: Tools index

  # Behaviour: AYW-052
  Scenario Outline: Each tool entry on the tools index has a description distinct from its link text
    Given I am on the tools index page
    When the "<tool>" entry renders
    Then the "<tool>" entry shows a description distinct from its link text

    Examples:
      | tool                      |
      | Cost of living calculator |
      | AI benchmark              |

  # Behaviour: AYW-052
  # EWT-001 (Rule-15 retest regression) — the page-level wrapper must never nest a second <main>
  # inside the app shell's own <main id="main-content"> landmark: a <main> must not contain another
  # <main> descendant (invalid HTML5) and produces two role="main" landmarks, a WCAG 4.1.2/1.3.1
  # defect. Bound at BOTH levels: the unit binding renders each page's own component tree in
  # isolation (without layout.tsx) and asserts it contains ZERO <main> elements — a real, jsdom-
  # capable check, since DOM structure needs no CSS; the e2e binding here asserts the REAL,
  # assembled page (WITH layout.tsx) has exactly ONE.
  Scenario Outline: Exactly one main landmark renders on the Tools pages
    When I navigate to "<path>"
    Then exactly one main landmark is present

    Examples:
      | path                   |
      | /en/tools              |
      | /en/tools/ai-benchmark |
