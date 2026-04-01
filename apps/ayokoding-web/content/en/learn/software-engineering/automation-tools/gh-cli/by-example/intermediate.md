---
title: "Intermediate"
weight: 10000002
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Intermediate GitHub CLI examples covering advanced PR workflows, releases, gists, actions, secrets, variables, codespaces, and label management"
tags: ["gh", "github-cli", "tutorial", "by-example", "code-first", "intermediate"]
---

This tutorial covers intermediate GitHub CLI concepts through 28 self-contained, heavily annotated
examples. The examples build on beginner authentication and repository skills to cover pull request
review workflows, release management, gist operations, GitHub Actions run management, secrets,
variables, labels, SSH keys, and Codespaces — spanning 35–70% of GitHub CLI features.

## Advanced Pull Request Workflows

### Example 29: Review a Pull Request

`gh pr review` submits an approval, request-for-changes, or comment review on a pull request,
with the option to compose a review body inline or in an editor.

```bash
# Approve PR #45 with a comment.
gh pr review 45 --approve --body "LGTM! The CSS fix looks correct and tests pass."
# => ✓ Approved pull request #45

# Request changes with detailed feedback.
gh pr review 45 --request-changes \
  --body "Please add unit tests for the media query breakpoints before merging."
# => ✓ Requested changes on pull request #45

# Submit a general comment review without approving or blocking.
gh pr review 45 --comment --body "Left some minor nit suggestions inline."
# => ✓ Reviewed pull request #45

# Open an editor to write the review body interactively.
gh pr review 45 --approve
# => (editor opens for review body; submitted when file is saved and closed)
```

**Key takeaway:** `gh pr review --approve` is the fastest way to approve a PR from the terminal
while staying in the code review context without navigating to the browser.

**Why it matters:** Code review velocity directly affects team throughput. When developers are
already in the terminal reviewing code locally, requiring a browser context switch to approve
adds enough friction that reviews are delayed. `gh pr review --approve` from inside the
checked-out branch — after running tests locally — removes that friction and increases the
likelihood of timely, thorough reviews.

---

### Example 30: Mark a PR as Ready for Review

`gh pr ready` converts a draft pull request into a regular PR, notifying requested reviewers
and making the PR eligible for merge.

```bash
# Mark the PR for the current branch as ready for review.
gh pr ready
# => ✓ Pull request #46 is marked as ready for review.
# => (any requested reviewers are now notified)

# Mark a specific PR by number as ready.
gh pr ready 46
# => ✓ Pull request #46 is marked as ready for review.

# Convert a ready PR back to draft (for example, to block premature merge).
gh pr ready 46 --undo
# => ✓ Pull request #46 is converted to draft.
```

**Key takeaway:** Use `gh pr ready` to promote a draft PR to review-ready state as the final
step before requesting reviews, signaling the work is complete.

**Why it matters:** The draft → ready transition is a formal signal in team workflows. Automating
it with a pre-push hook or CI step — for example, marking a PR ready only after all unit tests
pass locally — prevents reviewers from being notified about incomplete work. `gh pr ready --undo`
provides a safety valve to pull back a PR when a critical issue is discovered after review
notification.

---

### Example 31: Check PR CI Status

`gh pr checks` lists all status checks (GitHub Actions workflows, external CI, code coverage
services) for a pull request, showing pass/fail status and links to logs.

```bash
# Show CI check results for the PR associated with the current branch.
gh pr checks
# => All checks were successful
# =>
# => NAME               STATE   ELAPSED  URL
# => build              pass    45s      https://github.com/alice/my-project/actions/runs/123
# => test               pass    2m12s    https://github.com/alice/my-project/actions/runs/124
# => lint               pass    18s      https://github.com/alice/my-project/actions/runs/125
# => coverage/coveralls pass    31s      https://coveralls.io/builds/abc123

# Check CI status for a specific PR number.
gh pr checks 45
# => (same format as above for PR #45)

# Watch CI checks in real time (polls until all checks complete).
gh pr checks --watch
# => Refreshing checks status every 10 seconds. Press Ctrl+C to quit.
# => (updates in place until all checks pass or fail)
```

**Key takeaway:** `gh pr checks --watch` polls CI status in the terminal so you can monitor
a CI run without opening the browser Actions tab.

**Why it matters:** After pushing a fix for a failing test, the typical developer workflow
is to open the browser, navigate to the PR, and repeatedly refresh the Checks tab. `gh pr
checks --watch` replaces this with a terminal-native experience, freeing the developer to
read other code while glancing at the terminal for status updates. This is particularly
valuable on slow CI pipelines where the wait time is measured in minutes.

---

### Example 32: View PR Diff

`gh pr diff` displays the unified diff of a pull request's changes in the terminal, with
optional color output that works inside a pager.

```bash
# View the diff for the PR associated with the current branch.
gh pr diff
# => diff --git a/src/styles.css b/src/styles.css
# => index abc1234..def5678 100644
# => --- a/src/styles.css
# => +++ b/src/styles.css
# => @@ -45,7 +45,7 @@
# =>  .login-button {
# => -  @media (max-width: 376px) {
# => +  @media (max-width: 375px) {
# =>      margin-bottom: 80px;
# =>    }

# View the diff for a specific PR.
gh pr diff 45
# => (unified diff output for PR #45)

# View diff with no color (useful for piping into other tools).
gh pr diff --color never
# => (plain text diff without ANSI color codes)
```

**Key takeaway:** `gh pr diff` shows the exact changes in a PR without checking out the
branch, making it fast to verify what will be merged.

**Why it matters:** Reviewing the diff before merging or approving is a best practice that
many developers skip when the diff is accessible only through the GitHub UI. Reading the diff
in the terminal, adjacent to the codebase, provides better context. Small, focused diffs
reviewable in under a minute are more likely to receive thorough reviews.

---

### Example 33: Add a Comment to a Pull Request

`gh pr comment` adds a general (non-review) comment to a pull request, useful for status
updates, questions, or linking related resources.

```bash
# Add a comment to the current branch's PR.
gh pr comment --body "Deployed to staging for QA verification: https://staging.example.com"
# => https://github.com/alice/my-project/pull/45#issuecomment-123456791

# Add a comment to a specific PR by number.
gh pr comment 45 --body "Tests confirmed passing on Chrome, Firefox, and Safari."
# => https://github.com/alice/my-project/pull/45#issuecomment-123456792

# Open the editor to write a longer comment.
gh pr comment 45
# => (editor opens; comment posted when file is saved and closed)
```

**Key takeaway:** Use `gh pr comment` from deployment scripts to automatically post staging
URLs or test results back to the PR, creating a centralized record of QA activity.

**Why it matters:** PRs that include deployment and testing activity in their comment thread
provide a complete audit trail for the feature. When a post-deploy issue is discovered, the
staging URL in the PR comment lets anyone reproduce the exact build without searching through
deployment logs. Automating this comment from CI eliminates the manual step that developers
commonly forget.

---

## Release Management

### Example 34: Create a Release

`gh release create` creates a GitHub Release, uploads assets, generates release notes from
commits, and marks releases as pre-releases or latest.

```bash
# Create a release with auto-generated release notes from commits.
gh release create v1.2.0 \
  --title "v1.2.0 — Mobile UI Fixes" \
  --generate-notes
# => https://github.com/alice/my-project/releases/tag/v1.2.0
# => (release notes auto-generated from commit messages since last tag)

# Create a release with a specific tag, upload binary assets.
gh release create v1.2.0 \
  --title "v1.2.0" \
  --notes "Bug fixes and mobile improvements." \
  dist/my-app-linux-amd64 dist/my-app-darwin-arm64
# => https://github.com/alice/my-project/releases/tag/v1.2.0
# => (both binary files uploaded as release assets)

# Create a pre-release (not shown as latest).
gh release create v2.0.0-beta.1 \
  --title "v2.0.0-beta.1" \
  --notes "Beta release for testing." \
  --prerelease
# => https://github.com/alice/my-project/releases/tag/v2.0.0-beta.1
```

**Key takeaway:** `--generate-notes` automatically creates release notes from merged PR titles
since the last release tag — useful for projects following GitHub Flow with descriptive PR names.

**Why it matters:** Manual release notes are a bottleneck in the release process that teams often
skip, resulting in undocumented releases. `--generate-notes` turns merged PR titles into a
structured changelog automatically. Combined with a conventional commits practice, this produces
release notes good enough to publish directly to users, removing one of the most tedious parts
of the release workflow.

---

### Example 35: List and View Releases

`gh release list` shows all releases and pre-releases for a repository. `gh release view`
displays the full details of a specific release.

```bash
# List all releases for the current repository.
gh release list
# => TITLE                    TYPE    TAG NAME   PUBLISHED
# => v1.2.0 — Mobile UI Fixes latest  v1.2.0     about 5 minutes ago
# => v1.1.0 — Performance     latest  v1.1.0     about 2 weeks ago
# => v1.0.0 — Initial release latest  v1.0.0     about 1 month ago
# => v2.0.0-beta.1             pre     v2.0.0-beta.1  about 1 minute ago

# View the details of a specific release.
gh release view v1.2.0
# => v1.2.0 — Mobile UI Fixes
# => Tag: v1.2.0
# => Draft: No • Pre-release: No
# =>
# => ASSETS
# => my-app-linux-amd64  (8.4 MB)
# => my-app-darwin-arm64 (7.9 MB)
# =>
# => RELEASE NOTES
# => ## What's Changed
# => * Fix login button alignment on mobile by @alice in #45
```

**Key takeaway:** `gh release list` provides a chronological release history at a glance;
`gh release view TAG` shows the full release notes and downloadable assets.

**Why it matters:** During incident response, quickly identifying which release version a
production system is running and what changed between versions is critical. `gh release list`
and `gh release view` provide this information in seconds without navigating GitHub, enabling
faster root cause analysis when a new release causes an incident.

---

### Example 36: Delete a Release

`gh release delete` removes a GitHub Release without deleting the underlying git tag, allowing
you to re-publish with corrected notes or assets.

```bash
# Delete a release by its tag name.
gh release delete v1.2.0
# => ? Delete release v1.2.0? Yes
# => ✓ Deleted release v1.2.0
# => (the git tag v1.2.0 still exists; only the GitHub Release record is removed)

# Delete without confirmation prompt (for use in automation).
gh release delete v1.2.0 --yes
# => ✓ Deleted release v1.2.0

# Delete the release AND the underlying git tag.
gh release delete v1.2.0 --cleanup-tag --yes
# => ✓ Deleted release v1.2.0
# => ✓ Deleted tag v1.2.0
```

**Key takeaway:** `gh release delete` without `--cleanup-tag` removes only the release page;
`--cleanup-tag` also removes the git tag, which is required when a bad version must never be
re-used.

**Why it matters:** Accidentally publishing a release with the wrong binary or missing
assets happens. Deleting and re-creating the release corrects the mistake while keeping the
version number. Using `--cleanup-tag` is the right choice when a version was never actually
released to users and you want to ensure no systems accidentally pin to the bad tag.

---

### Example 37: Download Release Assets

`gh release download` fetches release assets to the local filesystem, useful for install
scripts and CI pipelines that consume published binaries.

```bash
# Download all assets from the latest release.
gh release download
# => (downloads all assets from the latest release to the current directory)
# => my-app-linux-amd64  downloaded  8.4 MB
# => my-app-darwin-arm64 downloaded  7.9 MB

# Download assets for a specific release tag.
gh release download v1.2.0
# => my-app-linux-amd64  downloaded  8.4 MB

# Download only specific assets matching a pattern.
gh release download v1.2.0 --pattern "*.tar.gz"
# => (downloads only .tar.gz files from the release)

# Download to a specific directory.
gh release download v1.2.0 --dir /tmp/release-assets
# => (all assets downloaded to /tmp/release-assets/)
```

**Key takeaway:** `gh release download --pattern` is ideal for install scripts that need
only the platform-specific binary from a multi-platform release.

**Why it matters:** Install scripts that rely on release assets often hard-code download URLs,
breaking whenever a new release is published. `gh release download` without a version tag
always fetches the latest release, making install scripts version-agnostic and automatically
correct. This is the recommended pattern for team tooling scripts that should always install
the latest approved version.

---

## Gist Operations

### Example 38: Create a Gist

`gh gist create` uploads files as a GitHub Gist, with options for public or secret visibility
and an optional description.

```bash
# Create a public gist from a file.
gh gist create hello.py
# => - Creating gist hello.py
# => ✓ Created public gist hello.py
# => https://gist.github.com/alice/abc123def456

# Create a secret gist with a description.
gh gist create hello.py --secret --desc "Python hello world example"
# => ✓ Created secret gist hello.py
# => https://gist.github.com/alice/xyz789ghi012

# Create a gist from stdin (pipe content directly).
echo "SELECT * FROM users LIMIT 10;" | gh gist create --filename query.sql
# => ✓ Created public gist query.sql
# => https://gist.github.com/alice/sql123abc456

# Create a gist from multiple files.
gh gist create file1.py file2.py --desc "Related Python scripts"
# => ✓ Created public gist with 2 files
# => https://gist.github.com/alice/multifile123
```

**Key takeaway:** `gh gist create` from stdin with `--filename` is the fastest way to share
a snippet from the clipboard or command output without creating a file first.

**Why it matters:** Gists are the right tool for sharing code snippets in documentation,
Slack messages, and GitHub issue comments. Creating gists from the terminal — especially
piping command output or clipboard content — is faster than the GitHub UI and integrates
naturally into the workflow of "write code in terminal, share it immediately."

---

### Example 39: List and View Gists

`gh gist list` shows your gists with their IDs and descriptions. `gh gist view` displays
the content of a specific gist in the terminal.

```bash
# List your recent gists.
gh gist list
# => ID              DESCRIPTION                  FILES  VISIBILITY  UPDATED
# => abc123def456    Python hello world example   1      public      about 5 min ago
# => xyz789ghi012    (no description)             1      secret      about 10 min ago
# => multifile123    Related Python scripts        2      public      about 1 hour ago

# View a gist by ID — displays all files in the terminal.
gh gist view abc123def456
# => hello.py
# =>
# => print("Hello, World!")

# View a specific file within a multi-file gist.
gh gist view multifile123 --filename file2.py
# => (renders only file2.py from the multi-file gist)

# Open a gist in the browser.
gh gist view abc123def456 --web
# => Opening gist.github.com/alice/abc123def456 in your browser.
```

**Key takeaway:** `gh gist view ID` is the fastest way to retrieve and display a previously
saved snippet without opening the browser.

**Why it matters:** Gists used as personal snippet libraries are most valuable when retrieval
is fast. Using `gh gist list` to find the ID and `gh gist view ID` to display the content
keeps the entire workflow in the terminal. Combining with shell aliases or `fzf` for fuzzy
search creates a powerful snippet management system.

---

### Example 40: Edit and Delete a Gist

`gh gist edit` opens a gist's files in your configured editor for modification. `gh gist
delete` permanently removes the gist.

```bash
# Edit a gist — opens the editor with the gist file content.
gh gist edit abc123def456
# => (editor opens with hello.py content; changes saved when file is closed)
# => ✓ Updated gist abc123def456

# Edit a specific file within a multi-file gist.
gh gist edit multifile123 --filename file1.py
# => (editor opens with only file1.py content)

# Delete a gist by ID.
gh gist delete abc123def456
# => ✓ Deleted gist abc123def456

# Delete without confirmation prompt.
gh gist delete abc123def456 --yes
# => ✓ Deleted gist abc123def456
```

**Key takeaway:** `gh gist edit` updates gist content in place without requiring you to
download, edit, and re-upload — it handles the diff automatically.

**Why it matters:** Gists used for living documentation — configuration snippets, onboarding
commands, or reference queries — need regular updates. The terminal-native edit workflow
(`gh gist edit`) is faster than the browser editor and integrates with your full editor setup
including linting and syntax highlighting.

---

## GitHub Actions Management

### Example 41: List Workflow Runs

`gh run list` shows recent workflow runs for the current repository, with filtering by workflow,
branch, and status. It is the terminal equivalent of the Actions tab.

```bash
# List recent workflow runs for the current repository.
gh run list
# => STATUS  TITLE                                WORKFLOW      BRANCH  EVENT   ID        ELAPSED  AGE
# => ✓       Fix login button alignment on mobile CI            main    push    123456789  3m15s    about 5 min
# => ✓       Update dependencies                  CI            main    push    123456788  2m44s    about 1 hour
# => ✗       Add dark mode support                CI            feat/dark-mode  push  123456787  1m22s  about 2 hours

# Filter by workflow name.
gh run list --workflow CI
# => (shows only runs from the "CI" workflow)

# Filter by branch.
gh run list --branch feat/dark-mode
# => (shows only runs triggered on the feat/dark-mode branch)

# Filter by status (completed, in_progress, queued).
gh run list --status failure
# => (shows only failed runs)

# Limit the number of results.
gh run list --limit 5
# => (shows only the 5 most recent runs)
```

**Key takeaway:** `gh run list --status failure` quickly surfaces recently failed workflow
runs, making it easy to identify which CI runs need investigation.

**Why it matters:** Monitoring CI health across branches is part of maintaining a healthy trunk.
`gh run list --status failure --branch main` gives an immediate picture of main branch health
without navigating the Actions tab. Piping the output to scripts enables automated failure
reports and Slack notifications.

---

### Example 42: View a Workflow Run

`gh run view` displays the details of a specific workflow run including job status, step
results, and links to full logs. It is the terminal alternative to clicking a run in the UI.

```bash
# View the most recent run for the current branch.
gh run view
# => ✗ CI #123456787 (Add dark mode support) • Triggered push by alice
# =>   Total duration: 1m22s
# =>   Artifacts: 0
# =>
# =>   JOBS
# =>   ✗ build (ubuntu-latest)  1m22s
# =>   ✓ lint (ubuntu-latest)   18s

# View a specific run by ID.
gh run view 123456787
# => (same detail view for that specific run ID)

# View a run and display all logs (streams step-by-step output).
gh run view 123456787 --log
# => (prints the full logs for all jobs and steps)

# View logs for only failed steps.
gh run view 123456787 --log-failed
# => (shows logs only for failed steps — faster root cause analysis)
```

**Key takeaway:** `gh run view --log-failed` filters the log to only failed steps, making
it the fastest way to diagnose a failing CI run without wading through successful step output.

**Why it matters:** A typical CI run produces hundreds of lines of log output. When a run
fails, the relevant error is buried in that output. `--log-failed` immediately shows only
the output of steps that failed, reducing triage time from minutes to seconds. This is one
of the most useful `gh` flags for teams with complex multi-step CI pipelines.

---

### Example 43: Watch a Running Workflow

`gh run watch` streams the real-time status of an in-progress workflow run, updating the
display as jobs and steps complete.

```bash
# Watch the most recent workflow run for the current branch in real time.
gh run watch
# => JOBS
# => • build (ubuntu-latest)
# =>   • Set up job
# =>   ✓ Checkout code
# =>   • Run tests         (running)
# => ...
# => (updates in place every few seconds)

# Watch a specific run by ID.
gh run watch 123456789
# => (watches that specific run)

# Exit with a non-zero status code if the watched run fails.
# This makes it composable in shell scripts.
gh run watch 123456789
# => Exit code: 0  (run succeeded)
# => Exit code: 1  (run failed — useful for scripted CI monitoring)
```

**Key takeaway:** `gh run watch` provides terminal-native live feedback on CI, replacing
browser polling with an updating terminal display that exits with a meaningful status code.

**Why it matters:** Deployment scripts that need to wait for CI before proceeding can use
`gh run watch` to block until the run completes and then check the exit code. This pattern
— trigger a workflow, watch it, act on the result — is fundamental to orchestrating
multi-step automated release pipelines entirely from the command line.

---

### Example 44: Re-run a Failed Workflow

`gh run rerun` re-triggers a workflow run, optionally re-running only the failed jobs to
save time and quota.

```bash
# Re-run all jobs in a failed workflow run.
gh run rerun 123456787
# => ✓ Requested rerun of run 123456787

# Re-run only the failed jobs (skips already-successful jobs).
gh run rerun 123456787 --failed
# => ✓ Requested rerun of failed jobs in run 123456787
# => (only the failing build job will be re-run; lint is skipped)

# Re-run with debug logging enabled for more verbose output.
gh run rerun 123456787 --debug
# => ✓ Requested rerun of run 123456787 with debug logging
```

**Key takeaway:** `gh run rerun --failed` re-runs only the jobs that failed, saving CI
minutes and shortening the feedback loop when a transient failure (network issue, flaky test)
caused the run to fail.

**Why it matters:** Flaky tests and transient network issues cause workflow runs to fail
without actual code problems. `--failed` avoids re-running the long, passing build job to
re-check a short, flaky test job. For teams that pay per CI minute, this optimization
adds up significantly over hundreds of re-runs per month.

---

### Example 45: List and Enable/Disable Workflows

`gh workflow list` shows all workflows in the repository. `gh workflow enable` and
`gh workflow disable` toggle whether a workflow triggers on events.

```bash
# List all workflows in the current repository.
gh workflow list
# => NAME                     STATE    ID
# => CI                       active   12345678
# => Deploy to Production     active   12345679
# => Nightly Dependency Scan  disabled 12345680

# Disable a workflow by ID or name (prevents future runs).
gh workflow disable "Nightly Dependency Scan"
# => ✓ Disabled workflow Nightly Dependency Scan

# Enable a previously disabled workflow.
gh workflow enable 12345680
# => ✓ Enabled workflow Nightly Dependency Scan

# View details of a specific workflow.
gh workflow view CI
# => CI - .github/workflows/ci.yml
# => ID: 12345678
# => State: active
# => (recent runs listed below)
```

**Key takeaway:** Disabling workflows is the safe way to pause automation without deleting
the workflow file — re-enabling requires no code changes.

**Why it matters:** During major refactoring or repository migrations, certain workflows may
produce noise or incorrect results. Disabling them temporarily avoids failed run notifications
without the risk of losing the workflow definition. This is preferable to commenting out
workflow files in git, which requires a commit and affects other branches.

---

### Example 46: Trigger a Workflow Manually

`gh workflow run` dispatches a workflow that has the `workflow_dispatch` trigger, passing
input values defined in the workflow file.

```bash
# Trigger a workflow by name with no inputs.
gh workflow run "Deploy to Production"
# => ✓ Created workflow_dispatch event for deploy.yml at main

# Trigger a workflow with input parameters.
# The input names must match those defined in the workflow's on.workflow_dispatch.inputs.
gh workflow run "Deploy to Production" \
  --field environment=staging \
  --field version=v1.2.0
# => ✓ Created workflow_dispatch event for deploy.yml at main
# => (workflow triggered with inputs: environment=staging, version=v1.2.0)

# Trigger a workflow on a specific branch.
gh workflow run CI --ref feat/dark-mode
# => ✓ Created workflow_dispatch event for ci.yml at feat/dark-mode
```

**Key takeaway:** `gh workflow run` with `--field` replaces the GitHub UI's "Run workflow"
form, enabling scriptable manual deployment triggers from the terminal or CI scripts.

**Why it matters:** `workflow_dispatch` with typed inputs is the standard pattern for
parameterized deployments. Being able to trigger these from the terminal without navigating
to the GitHub UI is critical for on-call scenarios — for example, triggering a rollback
workflow with `gh workflow run Rollback --field version=v1.1.0` during an incident is
faster and less error-prone than clicking through the browser UI.

---

## Secrets and Variables

### Example 47: Manage Repository Secrets

`gh secret set` creates or updates encrypted repository secrets used by GitHub Actions
workflows. Secrets are write-only from the CLI — you cannot read their values back.

```bash
# Set a secret by reading the value from stdin.
echo "my-super-secret-value" | gh secret set MY_SECRET
# => ✓ Set secret MY_SECRET for alice/my-project

# Set a secret from an environment variable (value never appears in shell history).
gh secret set MY_SECRET --body "$MY_SECRET_VALUE"
# => ✓ Set secret MY_SECRET for alice/my-project

# Set a secret for a specific repository.
gh secret set DEPLOY_KEY --repo alice/other-project --body "$DEPLOY_KEY_VALUE"
# => ✓ Set secret DEPLOY_KEY for alice/other-project

# List all secret names for the current repository (values are never shown).
gh secret list
# => NAME        UPDATED
# => MY_SECRET   about 5 minutes ago
# => DEPLOY_KEY  about 1 month ago

# Delete a secret.
gh secret delete MY_SECRET
# => ✓ Deleted secret MY_SECRET from alice/my-project
```

**Key takeaway:** Always use `--body "$VAR"` or stdin piping to pass secret values — never
include secrets directly in the command to prevent exposure in shell history.

**Why it matters:** Secrets management is a critical security practice. Passing secrets via
stdin or environment variables keeps them out of `~/.bash_history` and `/proc/*/cmdline`.
Automating secret rotation — for example, generating a new API key, setting it with `gh
secret set`, and deactivating the old key — is a common operational pattern that should be
scripted rather than performed manually.

---

### Example 48: Manage Environment Secrets

Environment secrets are scoped to a specific deployment environment (e.g., production,
staging) and can have required reviewers. They provide an additional layer of access control.

```bash
# Set a secret for a specific deployment environment.
gh secret set PROD_DB_URL \
  --env production \
  --body "$PROD_DATABASE_URL"
# => ✓ Set secret PROD_DB_URL for alice/my-project in environment production

# Set a staging environment secret.
gh secret set STAGING_DB_URL \
  --env staging \
  --body "$STAGING_DATABASE_URL"
# => ✓ Set secret STAGING_DB_URL for alice/my-project in environment staging

# List secrets for a specific environment.
gh secret list --env production
# => NAME        UPDATED
# => PROD_DB_URL about 5 minutes ago

# Set an organization-level secret accessible to selected repositories.
gh secret set ORG_DEPLOY_KEY \
  --org myorg \
  --visibility selected \
  --repos my-project,other-project \
  --body "$DEPLOY_KEY"
# => ✓ Set secret ORG_DEPLOY_KEY for myorg
```

**Key takeaway:** Scope secrets to environments for production access control — environment
secrets can require manual approval before deployment workflows can access them.

**Why it matters:** Repository-level secrets are accessible to all workflows in the repo.
Environment secrets for production add an approval gate, preventing automated workflows from
accidentally deploying to production or accessing production credentials without human review.
This is a critical security control for regulated environments and fintech applications.

---

### Example 49: Manage Variables

Variables are non-secret configuration values used in workflows, similar to secrets but
readable. They are appropriate for environment names, feature flags, and non-sensitive config.

```bash
# Set a repository variable.
gh variable set APP_ENV --body "production"
# => ✓ Set variable APP_ENV for alice/my-project

# Set a variable for a specific environment.
gh variable set MAX_REPLICAS --env production --body "10"
# => ✓ Set variable MAX_REPLICAS for alice/my-project in environment production

# List all variables for the current repository.
gh variable list
# => NAME     VALUE        UPDATED
# => APP_ENV  production   about 5 minutes ago

# List variables for a specific environment.
gh variable list --env production
# => NAME          VALUE  UPDATED
# => MAX_REPLICAS  10     about 5 minutes ago

# Delete a variable.
gh variable delete APP_ENV
# => ✓ Deleted variable APP_ENV from alice/my-project
```

**Key takeaway:** Use variables for non-sensitive configuration like environment names, replica
counts, and feature flags — use secrets only for sensitive values like passwords and tokens.

**Why it matters:** Mixing secrets and non-secret configuration in the secrets store makes
auditing harder and complicates rotation workflows. Variables are readable and auditable,
making it easy to verify the current configuration state of a workflow without decryption.
Separating the two categories also makes access control cleaner.

---

## Label Management

### Example 50: Create and List Labels

`gh label create` adds a new label to a repository's label set. `gh label list` shows all
existing labels with their colors and descriptions.

```bash
# Create a new label with a color and description.
gh label create "performance" \
  --color "#0173B2" \
  --description "Performance-related issues and improvements"
# => ✓ Label "performance" created in alice/my-project

# List all labels for the current repository.
gh label list
# => NAME         DESCRIPTION                               COLOR
# => bug          Something isn't working                   #d73a4a
# => documentation Improvements or additions to docs        #0075ca
# => performance  Performance-related issues and improvements #0173B2

# List labels for a specific repository.
gh label list --repo cli/cli
# => (lists all labels in the cli/cli repository)
```

**Key takeaway:** Create labels with semantic colors — use the accessible color palette for
consistency with your documentation and diagrams.

**Why it matters:** A consistent, well-defined label taxonomy is the foundation of issue
triage and sprint planning. Labels with clear colors and descriptions reduce ambiguity about
where an issue belongs. Scripting label creation with `gh label create` enables label set
synchronization across multiple repositories in an organization, ensuring consistent triage
workflows everywhere.

---

### Example 51: Edit and Delete Labels

`gh label edit` updates a label's name, color, or description. `gh label delete` removes
a label from the repository.

```bash
# Edit an existing label's color and description.
gh label edit "performance" \
  --color "#029E73" \
  --description "Performance optimization issues"
# => ✓ Label "performance" edited in alice/my-project

# Rename a label.
gh label edit "performance" --name "perf"
# => ✓ Label "perf" edited in alice/my-project

# Delete a label.
gh label delete "perf"
# => ✓ Label "perf" deleted from alice/my-project

# Delete without confirmation prompt.
gh label delete "perf" --yes
# => ✓ Label "perf" deleted from alice/my-project
```

**Key takeaway:** Renaming labels with `gh label edit --name` updates the label name in all
existing issues and PRs automatically — no manual re-labeling required.

**Why it matters:** Label taxonomy evolves as teams refine their triage process. Being able to
rename, re-color, and delete labels while preserving their association with existing issues
prevents orphaned labels and maintains clean issue history. Scripting label set synchronization
across repositories ensures that label updates propagate everywhere in the organization.

---

## SSH Keys and Codespaces

### Example 52: Add and List SSH Keys

`gh ssh-key add` uploads an SSH public key to your GitHub account, enabling SSH-based git
operations. `gh ssh-key list` shows all registered keys.

```bash
# Add a new SSH public key to your GitHub account.
# Reads the key from the file; only the public key is uploaded.
gh ssh-key add ~/.ssh/id_ed25519.pub --title "Work Laptop 2026"
# => ✓ Public key added to your account

# List all SSH keys registered on your account.
gh ssh-key list
# => TITLE             ID      KEY           ADDED
# => Work Laptop 2026  8675309 SHA256:...    about 5 minutes ago
# => Old MacBook Pro   1234567 SHA256:...    about 2 years ago

# Delete an SSH key by ID.
gh ssh-key delete 1234567
# => ✓ SSH key 1234567 (Old MacBook Pro) deleted from your account
```

**Key takeaway:** `gh ssh-key add` is the terminal-native way to register a new machine's
SSH key — no browser navigation to Settings → SSH Keys required.

**Why it matters:** New developer onboarding includes generating an SSH key and adding it to
GitHub. Automating this step with `gh ssh-key add` as part of an onboarding script reduces
setup friction and ensures the key is correctly registered before any git operations are
attempted. Regular SSH key rotation is also automatable using `gh ssh-key delete` and `gh
ssh-key add` in sequence.

---

### Example 53: Codespace: Create and List

`gh codespace create` provisions a GitHub Codespace for a repository, and `gh codespace list`
shows all your active and stopped Codespaces.

```bash
# Create a Codespace for the current repository (interactive machine selection).
gh codespace create
# => ? Choose a machine type: 2-core, 8GB RAM, 32GB storage
# => ✓ Codespace created: alice-my-project-abc123
# => (Codespace is provisioning and will be ready in ~30 seconds)

# Create a Codespace non-interactively with a specific machine type and branch.
gh codespace create \
  --repo alice/my-project \
  --branch feat/dark-mode \
  --machine basicLinux32gb
# => ✓ Codespace created: alice-my-project-xyz789

# List all Codespaces for your account.
gh codespace list
# => NAME                      DISPLAY NAME  REPOSITORY         BRANCH          STATE    CREATED
# => alice-my-project-abc123  my-project    alice/my-project   main            Active   about 5 min ago
# => alice-my-project-xyz789  my-project    alice/my-project   feat/dark-mode  Stopped  about 2 days ago
```

**Key takeaway:** `gh codespace create --repo --branch --machine` creates a fully provisioned
development environment in the cloud, specifiable entirely from the terminal.

**Why it matters:** Codespaces enable consistent development environments that match production
configuration without local setup. Creating a Codespace for a specific PR branch allows
reviewers to test code changes in a clean environment without affecting their local setup.
This is particularly valuable for reviewing PRs that change development environment configuration
files like `devcontainer.json`.

---

### Example 54: SSH into a Codespace

`gh codespace ssh` opens an SSH session into a running Codespace, providing terminal access
to the remote development environment.

```bash
# SSH into the most recently used Codespace (prompts if multiple exist).
gh codespace ssh
# => ? Choose a codespace: alice-my-project-abc123 (main)
# => Welcome to Ubuntu 20.04.6 LTS
# => (now inside the remote Codespace environment)

# SSH into a specific Codespace by name.
gh codespace ssh --codespace alice-my-project-abc123
# => Welcome to Ubuntu 20.04.6 LTS
# => (connected to the named Codespace)

# Run a single command in a Codespace without an interactive session.
gh codespace ssh --codespace alice-my-project-abc123 -- "npm test"
# => > my-project@1.2.0 test
# => > vitest run
# => ✓ 42 tests pass
```

**Key takeaway:** `gh codespace ssh -- "command"` runs a single command remotely in a
Codespace, enabling CI-like testing in a pre-configured cloud environment from the terminal.

**Why it matters:** When a bug only reproduces in an environment with specific dependencies
or OS versions, `gh codespace ssh` provides access to that environment without complex local
VM setup. Running tests in the Codespace with `-- "npm test"` verifies that the code works
in the standardized team environment, not just on your local machine configuration.

---

### Example 55: Stop and Delete a Codespace

`gh codespace stop` suspends a Codespace to preserve its state while stopping billing.
`gh codespace delete` permanently removes it.

```bash
# Stop a running Codespace (suspends it, preserves state).
gh codespace stop --codespace alice-my-project-abc123
# => ✓ Codespace alice-my-project-abc123 stopped

# Stop all Codespaces (useful for end-of-day cleanup).
gh codespace stop --all
# => ✓ Codespace alice-my-project-abc123 stopped
# => ✓ Codespace alice-my-project-xyz789 stopped

# Delete a stopped Codespace permanently.
gh codespace delete --codespace alice-my-project-xyz789
# => ✓ Codespace alice-my-project-xyz789 deleted

# Delete all stopped Codespaces older than 7 days.
gh codespace delete --days 7 --all
# => ✓ Deleted 3 codespaces older than 7 days
```

**Key takeaway:** Stop Codespaces when not in use to pause billing; delete them when the work
is complete and changes have been committed and pushed.

**Why it matters:** Forgotten running Codespaces accrue billing charges. Establishing a habit
of stopping Codespaces at the end of each session, and deleting them after merging the
associated PR, keeps Codespace costs predictable. `gh codespace stop --all` is a good end-of-day
shell alias that ensures no idle Codespaces run overnight.

---

### Example 56: Port Forwarding in a Codespace

`gh codespace ports forward` exposes a port running inside a Codespace to your local machine,
allowing you to access web servers, databases, and other services running in the cloud environment.

```bash
# Forward Codespace port 3000 to local port 3000.
gh codespace ports forward 3000:3000 --codespace alice-my-project-abc123
# => Forwarding ports: ...
# => 3000 -> localhost:3000
# => (local browser can now access http://localhost:3000 which serves from the Codespace)

# Forward multiple ports simultaneously.
gh codespace ports forward 3000:3000 5432:5432 --codespace alice-my-project-abc123
# => 3000 -> localhost:3000  (Next.js dev server)
# => 5432 -> localhost:5432  (PostgreSQL in the Codespace)

# List open ports in a Codespace.
gh codespace ports --codespace alice-my-project-abc123
# => LABEL      PORT  VISIBILITY  BROWSE URL
# => nextjs     3000  private     https://alice-my-project-abc123-3000.app.github.dev
# => postgres   5432  private     (not browsable)
```

**Key takeaway:** Port forwarding bridges your local browser to services running in a Codespace,
enabling local browser testing of code that runs in the remote cloud environment.

**Why it matters:** Full-stack development in a Codespace requires access to both the frontend
and database services. Port forwarding makes this transparent — the developer experience in the
local browser is identical to local development, but the code runs in the controlled, consistent
Codespace environment. This is the key feature that makes Codespaces a complete local development
replacement rather than just a code editor.
