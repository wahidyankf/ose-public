@bc-validate
Feature: Bounded-Context Structural Parity Validation

  As a developer
  I want rhino-cli bc validate to verify the DDD registry matches the filesystem
  So that structural drift between bounded-context declarations and code folders is caught at commit time

  Scenario: Clean registry matches filesystem exactly — exits zero
    Given a registry with one bounded context "journal" declaring layers "[domain, application, infrastructure, presentation]"
    And a glossary file exists at the registered glossary path
    And a gherkin folder exists at the registered gherkin path containing at least one feature file
    And the code folder contains exactly the declared layer subfolders
    When the developer runs "rhino-cli bc validate organiclever"
    Then the command exits successfully
    And no findings are printed to stdout

  Scenario: Orphan code folder not in registry is flagged
    Given a registry that does not list a context named "phantom"
    And a folder "apps/organiclever-web/src/contexts/phantom/" exists on the filesystem
    When the developer runs "rhino-cli bc validate organiclever"
    Then the command exits with a failure code
    And the output mentions "orphan"
    And the output mentions "phantom"

  Scenario: Missing glossary file is flagged
    Given a registry listing context "journal" with a registered glossary path
    And the glossary file does not exist at that path
    When the developer runs "rhino-cli bc validate organiclever"
    Then the command exits with a failure code
    And the output mentions "missing glossary"
    And the output mentions "journal"

  Scenario: Missing layer subfolder is flagged
    Given a registry listing context "journal" with layers "[domain, application, infrastructure, presentation]"
    And the code folder is missing the "infrastructure" subfolder
    When the developer runs "rhino-cli bc validate organiclever"
    Then the command exits with a failure code
    And the output mentions "missing layer"
    And the output mentions "infrastructure"

  Scenario: Extra layer subfolder not in registry is flagged
    Given a registry listing context "journal" with layers "[domain, application, presentation]"
    And the code folder contains an extra "infrastructure" subfolder not declared in the registry
    When the developer runs "rhino-cli bc validate organiclever"
    Then the command exits with a failure code
    And the output mentions "extra layer"
    And the output mentions "infrastructure"

  Scenario: Missing gherkin folder is flagged
    Given a registry listing context "journal" with a registered gherkin path
    And the gherkin folder does not exist at that path
    When the developer runs "rhino-cli bc validate organiclever"
    Then the command exits with a failure code
    And the output mentions "missing gherkin"
    And the output mentions "journal"

  Scenario: Gherkin folder with no feature files is flagged
    Given a registry listing context "journal" with a registered gherkin path
    And the gherkin folder exists but contains no ".feature" files
    When the developer runs "rhino-cli bc validate organiclever"
    Then the command exits with a failure code
    And the output mentions "no feature files"
    And the output mentions "journal"

  Scenario: Relationship asymmetry is flagged
    Given a registry where context "workout-session" declares a customer-supplier relationship to "journal" as customer
    And context "journal" declares no reciprocal relationship
    When the developer runs "rhino-cli bc validate organiclever"
    Then the command exits with a failure code
    And the output mentions "asymmetry"
    And the output mentions "journal"

  Scenario: Severity warn flag downgrades findings to warnings and exits zero
    Given a registry with an orphan code folder present on the filesystem
    When the developer runs "rhino-cli bc validate organiclever --severity=warn"
    Then the command exits successfully
    And the output contains the word "warning"

  Scenario: ORGANICLEVER_RHINO_DDD_SEVERITY env var overrides default severity
    Given a registry with an orphan code folder present on the filesystem
    And the environment variable "ORGANICLEVER_RHINO_DDD_SEVERITY" is set to "warn"
    When the developer runs "rhino-cli bc validate organiclever"
    Then the command exits successfully
    And the output contains the word "warning"

  Scenario: Registry file not found for unknown app is an error
    When the developer runs "rhino-cli bc validate unknownapp"
    Then the command exits with a failure code
    And the output mentions "not found" or "unknownapp"
