Feature: Feature compilation

  As an Elixir application test author
  I want canonical Gherkin expanded into isolated ExUnit tests
  So that the behavior contract can run through the application's chosen adapter

  Background:
    Given the library is imported

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / Recursive discovery includes nested feature files
  @e2e-exempt
  Scenario: Recursive discovery includes nested feature files
    Given a configured feature glob matches files in nested domain directories
    When the engine discovers that feature corpus
    Then it discovers every matching feature file
    And it retains each scenario's source location

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / Each outline row becomes its own executable scenario
  @e2e-exempt
  Scenario: Each outline row becomes its own executable scenario
    Given a scenario outline has two example rows
    When the engine compiles the feature
    Then it creates one executable scenario for each row
    And each scenario receives its own substituted example values

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / Background steps run before each scenario
  @e2e-exempt
  Scenario: Background steps run before each scenario
    Given a feature has a background and two scenarios
    When the engine executes the compiled feature
    Then each scenario receives its own background setup before its scenario steps
    And state from the first scenario does not leak into the second

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / Structured step arguments reach the selected binding
  @e2e-exempt
  Scenario: Structured step arguments reach the selected binding
    Given a feature includes a data table and a media-typed doc string
    When the engine executes their matching steps
    Then the bindings receive the authored table values and doc-string content
    And the doc-string media type remains available

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / The consumer can select an ExUnit case template
  @e2e-exempt
  Scenario: The consumer can select an ExUnit case template
    Given the consumer configures its own ExUnit case template
    When the engine compiles the configured features
    Then the generated scenarios use that case template
    And the template's setup context reaches the scenario driver
