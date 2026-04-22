@docs-validate-mermaid
Feature: Mermaid Flowchart Structural Validation

  As a documentation author
  I want to detect structural issues in Mermaid flowchart diagrams
  So that diagrams render correctly and are readable in all viewers

  Scenario: A flowchart with all short node labels passes validation
    Given a markdown file containing a flowchart where every node label is within the limit
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A node label exceeding the character limit is flagged
    Given a markdown file containing a flowchart with a node label longer than the limit
    When the developer runs docs validate-mermaid
    Then the command exits with a failure code
    And the output identifies the file, block, and node with the oversized label

  Scenario: The max label length is configurable via flag
    Given a markdown file containing a flowchart with a node label of 35 characters
    When the developer runs docs validate-mermaid with --max-label-len 40
    Then the command exits successfully

  Scenario: A deep sequential flowchart (long chain) passes validation regardless of depth
    Given a markdown file containing a TB flowchart with 10 nodes chained sequentially
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A TB flowchart with at most 3 nodes per rank passes validation
    Given a markdown file containing a TB flowchart where no rank has more than 3 nodes
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A TB flowchart with 4 nodes at one rank is flagged
    Given a markdown file containing a TB flowchart where one rank has 4 parallel nodes
    When the developer runs docs validate-mermaid
    Then the command exits with a failure code
    And the output identifies the file and block with the excessive width

  Scenario: A LR flowchart with at most 3 nodes per rank passes validation
    Given a markdown file containing an LR flowchart where no rank has more than 3 nodes
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A LR flowchart with 4 nodes at one rank is flagged
    Given a markdown file containing an LR flowchart where one rank has 4 nodes at the same depth
    When the developer runs docs validate-mermaid
    Then the command exits with a failure code
    And the output identifies the file and block with the excessive width

  Scenario: The max width is configurable via flag
    Given a markdown file containing a flowchart with 4 nodes at one rank
    When the developer runs docs validate-mermaid with --max-width 5
    Then the command exits successfully

  Scenario: A flowchart exceeding both width and depth thresholds passes with a warning
    Given a markdown file containing a flowchart with 4 nodes at one rank and more than 5 ranks deep
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output contains a warning about diagram complexity

  Scenario: The max depth threshold for the both-exceeded warning is configurable via flag
    Given a markdown file containing a flowchart with 4 nodes at one rank and exactly 4 ranks deep
    When the developer runs docs validate-mermaid with --max-depth 3
    Then the command exits successfully
    And the output contains a warning about diagram complexity

  Scenario: A mermaid block with a single flowchart passes validation
    Given a markdown file containing a mermaid code block with exactly one flowchart diagram
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A mermaid block with two flowchart declarations is flagged
    Given a markdown file containing a mermaid code block with two flowchart declarations
    When the developer runs docs validate-mermaid
    Then the command exits with a failure code
    And the output identifies the file and block with multiple diagrams

  Scenario: A mermaid block using the graph keyword alias is validated identically
    Given a markdown file containing a mermaid block using the graph keyword instead of flowchart with no violations
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: Non-flowchart mermaid blocks are ignored
    Given a markdown file containing only sequenceDiagram and classDiagram mermaid blocks
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A markdown file with no mermaid blocks passes validation
    Given a markdown file containing no mermaid code blocks
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: With --staged-only only staged markdown files are checked
    Given a markdown file with a mermaid violation that has not been staged in git
    When the developer runs docs validate-mermaid with the --staged-only flag
    Then the command exits successfully

  Scenario: With --changed-only only files changed since upstream are checked
    Given a markdown file with a mermaid violation that is not in the push range
    When the developer runs docs validate-mermaid with the --changed-only flag
    Then the command exits successfully

  Scenario: JSON output contains structured violation data
    Given a markdown file containing a flowchart with a label length violation
    When the developer runs docs validate-mermaid with -o json
    Then the output is valid JSON
    And the JSON contains the violation kind, file path, block index, and node id

  Scenario: Markdown output produces a formatted table
    Given a markdown file containing a flowchart with a label length violation
    When the developer runs docs validate-mermaid with -o markdown
    Then the output contains a table with File, Block, Line, Severity, Kind, and Detail columns

  Scenario: Verbose flag includes per-file detail in text output
    Given a markdown file containing a flowchart with no violations
    When the developer runs docs validate-mermaid with --verbose
    Then the command exits successfully
    And the output includes per-file scan detail lines

  Scenario: Quiet flag suppresses non-error output when there are no violations
    Given a markdown file containing a flowchart with no violations
    When the developer runs docs validate-mermaid with --quiet
    Then the command exits successfully
    And the output contains no text
