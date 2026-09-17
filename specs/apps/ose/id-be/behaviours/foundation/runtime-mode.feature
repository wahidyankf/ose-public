Feature: OSE ID backend runtime mode guard

  As a security reviewer
  I want the backend to refuse every runtime mode it is not finished for
  So that incomplete identity behaviour can never be reached outside local development and testing

  Rule: Backend serving is disabled outside Local or Test

    Scenario Outline: Reject an unsupported backend runtime mode
      Given the backend runtime mode is <mode>
      When the backend process starts
      Then startup exits non-zero before serving the application
      And the diagnostic returns the stable runtime-mode-disabled code

      Examples:
        | mode       |
        | Staging    |
        | Production |
        | missing    |
        | unknown    |
