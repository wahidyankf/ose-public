Feature: OSE ID web runtime mode guard

  As a security reviewer
  I want the web shell to refuse every runtime mode it is not finished for
  So that an inert local diagnostic surface can never be served outside local development and testing

  Rule: Web serving is disabled outside Local or Test

    Scenario Outline: Reject an unsupported web runtime mode
      Given the web runtime mode is <mode>
      When the web process starts
      Then startup exits non-zero before serving the application
      And the diagnostic returns the stable runtime-mode-disabled code

      Examples:
        | mode       |
        | Staging    |
        | Production |
        | missing    |
        | unknown    |
