Feature: Arc landing with one or two roles

  As a reader opening a career arc
  I want every role card to render fully, with its own facts
  So that I never see a sparse stub, an empty placeholder card, or one shared value for two roles

  # Behaviour: AYW-114
  Scenario Outline: An arc landing renders one full card per role
    Given a fixture arc manifest lists <roles> role(s)
    When a reader opens that arc's landing page
    Then each role card renders in full with its own preview or course counts
    And no role card is a placeholder or an empty grid cell

    Examples:
      | roles |
      | 1     |
      | 2     |
