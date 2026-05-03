@governance-vendor-audit
Feature: Governance Vendor Audit

  As a repository maintainer
  I want to scan governance markdown files for vendor-specific terms
  So that the governance layer stays vendor-neutral

  Scenario: A forbidden term in plain prose fails the audit
    Given a governance markdown file containing "Claude Code" in plain prose
    When the developer runs governance vendor-audit on the file
    Then the command exits with a failure code
    And the output identifies the forbidden term and its location

  Scenario: A forbidden term inside a code fence passes the audit
    Given a governance markdown file containing "Claude Code" inside a code fence
    When the developer runs governance vendor-audit on the file
    Then the command exits successfully
    And the output reports zero findings

  Scenario: A forbidden term inside a binding-example fence passes the audit
    Given a governance markdown file containing "Claude Code" inside a binding-example fence
    When the developer runs governance vendor-audit on the file
    Then the command exits successfully
    And the output reports zero findings

  Scenario: A forbidden term under a Platform Binding Examples heading passes the audit
    Given a governance markdown file containing "Claude Code" under a "Platform Binding Examples" heading
    When the developer runs governance vendor-audit on the file
    Then the command exits successfully
    And the output reports zero findings

  Scenario: A governance directory with no forbidden terms passes the audit
    Given a governance directory with no forbidden terms in prose
    When the developer runs governance vendor-audit on the directory
    Then the command exits successfully
    And the output reports zero findings

  Scenario: Capitalized branded Skills in plain prose fails the audit
    Given a governance markdown file containing "Skills" in plain prose
    When the developer runs governance vendor-audit on the file
    Then the command exits with a failure code
    And the output identifies the forbidden term and its location

  Scenario: Capitalized Skills inside a code fence passes the audit
    Given a governance markdown file containing "Skills" inside a code fence
    When the developer runs governance vendor-audit on the file
    Then the command exits successfully
    And the output reports zero findings
