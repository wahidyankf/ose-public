Feature: Independent local development

  As a developer working on the learning site
  I want the rewrite to run beside the existing site
  So that both implementations and content work can progress independently

  Scenario: Both sites run on their own default development ports
    Given the existing learning site is running on port 3101
    When the rewrite starts without a port override
    Then the rewrite serves its bilingual entry pages on port 3102
    And the existing site still answers requests on port 3101

  Scenario: A prefixed port override changes only the rewrite listener
    Given AYOKODING_WEB_PORT is set to an available valid port
    When the rewrite starts
    Then the rewrite listens on that port
    And the existing site's configured port remains unchanged

  Scenario: An explicit port flag wins over the prefixed environment value
    Given AYOKODING_WEB_PORT contains one valid port
    And the rewrite launcher receives a different valid port through its explicit port flag
    When the rewrite starts
    Then it listens on the explicit flag's port
    And it does not listen on the environment value's port

  Scenario: A generic PORT variable does not retarget the rewrite
    Given only the generic PORT variable contains a different valid port
    When the rewrite starts without a prefixed override or explicit port flag
    Then the rewrite listens on port 3102

  Scenario: An invalid port override fails before accepting requests
    Given AYOKODING_WEB_PORT is set to an invalid port value
    When the rewrite starts
    Then startup fails with a diagnostic naming AYOKODING_WEB_PORT
    And no rewrite listener starts on a fallback port

  Scenario: Playwright owns an isolated local rewrite server
    Given the existing site and the rewrite development server are running
    When the rewrite browser acceptance suite starts
    Then it starts its own Phoenix server on port 3191
    And it leaves both development servers running after the suite finishes

  Scenario: Reading shared sources does not rewrite tracked content
    Given the shared Markdown and manifests have recorded byte hashes
    When a developer starts the rewrite and browses its course pages
    Then the Markdown and manifest byte hashes remain unchanged
    And the rewrite does not run a content-index generator implicitly

  Scenario: Unfinished content work does not block the rewrite
    Given other learning-content plans are unfinished
    And the current shared corpus has a valid committed state
    When the rewrite loads that committed corpus
    Then it serves the available content and manifests from that state
    And it does not wait for another plan to finish
