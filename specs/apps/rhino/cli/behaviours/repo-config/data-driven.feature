@repo-config-data-driven
Feature: Repo-specific behaviour is data-driven from repo-config.yml

  As a maintainer keeping rhino-cli byte-identical across ose-public and the private sibling
  I want every per-repo behaviour (env globs, gate arguments, doctor tool skips) read from repo-config.yml
  So that the source stays identical and only the per-repo data file differs

  # Exemption(e2e): parsed repository configuration is typed in-process state absent from public command output; alternative-proof: rhino-cli:test:integration / Repo-specific behaviour is data-driven, not hard-coded
  @e2e-exempt
  Scenario: Repo-specific behaviour is data-driven, not hard-coded
    Given rhino-cli's repo-specific behaviour (env globs, doctor tool skips)
    When rhino-cli runs
    Then it reads that behaviour from repo-config.yml, not from source hard-coded per repo

  # Exemption(e2e): individual typed harness fields are internal loader state absent from public command output; alternative-proof: rhino-cli:test:integration / The codex registry entry declares the generated tier and its mirror source
  @e2e-exempt
  Scenario: The codex registry entry declares the generated tier and its mirror source
    Given the harness registry section of repo-config.yml
    When the codex entry is read
    Then the entry declares the generated tier
    And the entry declares .codex/agents as its agent directory
    And the entry declares .claude/agents as the source it mirrors
    And the entry declares no forbidden directory

  # Exemption(e2e): the loader's complete typed harness collection is not rendered by a public command; alternative-proof: rhino-cli:test:integration / The registry declares exactly the three supported harnesses
  @e2e-exempt
  Scenario: The registry declares exactly the three supported harnesses
    Given the harness registry section of repo-config.yml
    When the full registry is read
    Then it names exactly claude-code, opencode, and codex

  # Exemption(e2e): the scenario observes the configuration-to-audit collaborator handoff rather than a stable public output; alternative-proof: rhino-cli:test:integration / Gate exclusion lists move to the registry
  @e2e-exempt
  Scenario: Gate exclusion lists move to the registry
    Given the frontmatter-date gate declares website exclusions
    When the configured frontmatter-date audit runs
    Then configured excluded website content is skipped

  # Exemption(e2e): the resolved ToolDef source and requirement are internal Doctor collaborator state; alternative-proof: rhino-cli:test:integration / Doctor .NET SDK path moves to repository configuration
  @e2e-exempt
  Scenario: Doctor .NET SDK path moves to repository configuration
    Given the Doctor configuration declares a .NET SDK path
    When Doctor resolves its required .NET SDK version
    Then the configured global.json supplies that version

  # Exemption(e2e): optional-loader absence is an internal result not exposed by any public command; alternative-proof: rhino-cli:test:integration / A confirmed-absent repo-config.yml yields no mirrors and exits cleanly
  @e2e-exempt
  Scenario: A confirmed-absent repo-config.yml yields no mirrors and exits cleanly
    Given no repo-config.yml exists in the repository
    When the optional repo-config loader runs
    Then it reports confirmed absence, not an error

  # Exemption(e2e): optional-loader result discrimination is an internal API contract not exposed by a public command; alternative-proof: rhino-cli:test:integration / An unreadable repo-config.yml is a loud error, never a silent success
  @e2e-exempt
  Scenario: An unreadable repo-config.yml is a loud error, never a silent success
    Given a repo-config.yml that is not valid YAML
    When the optional repo-config loader runs
    Then it reports an error and never prints a success or SKIPPED line

  Scenario: A leading ./ in a configured path is rejected
    Given repo-config.yml declares a doctor .NET SDK path with a leading ./ segment
    When repo-config validate runs
    Then it rejects the value naming the current-directory component

  # Exemption(e2e): the confined path value is internal loader state and no public command renders it; alternative-proof: rhino-cli:test:integration / An existing configured file resolves without a trailing separator
  @e2e-exempt
  Scenario: An existing configured file resolves without a trailing separator
    Given repo-config.yml declares a path to a file that already exists
    When the configured path is confined to the repository root
    Then the resolved path reads as the existing regular file, not a directory

  # Exemption(e2e): the extension read is typed in-process loader state absent from public command output; alternative-proof: rhino-cli:test:integration / A v2 repository configuration is read from its rhino-cli extension
  @e2e-exempt
  Scenario: A v2 repository configuration is read from its rhino-cli extension
    Given a v2 repo-config.yml whose rhino-cli extension declares a doctor skip tool
    When rhino-cli runs
    Then it reads the skip tool from the extension and none of the core gates
