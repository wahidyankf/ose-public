---
title: "Beginner"
weight: 10000001
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Beginner GitHub CLI examples covering authentication, repository operations, issue management, pull request basics, and configuration"
tags: ["gh", "github-cli", "tutorial", "by-example", "code-first", "beginner"]
---

This tutorial covers core GitHub CLI concepts through 28 self-contained, heavily annotated shell
examples. Each example is a complete, runnable command or script demonstrating one focused concept.
The examples progress from initial authentication through repositories, issues, pull requests, and
configuration — spanning 0–35% of GitHub CLI features.

## Authentication

### Example 1: Interactive Login

`gh auth login` starts an interactive authentication flow that guides you through connecting
`gh` to your GitHub account. It supports both GitHub.com and GitHub Enterprise Server, and
stores credentials securely in the system keychain or a config file.

```bash
# Start the interactive authentication flow.
# gh will ask a series of questions to configure your credentials.
gh auth login
# => ? What account do you want to log into? GitHub.com
# => ? What is your preferred protocol for Git operations? HTTPS
# => ? Authenticate Git with your GitHub credentials? Yes
# => ? How would you like to authenticate GitHub CLI? Login with a web browser
# => ! First copy your one-time code: XXXX-XXXX
# => Press Enter to open github.com in your browser...
# => ✓ Authentication complete.
# => - gh config set -h github.com git_protocol https
# => ✓ Configured git protocol
# => ✓ Logged in as your-username
```

**Key takeaway:** `gh auth login` is the first command you run after installing `gh`; it stores
OAuth credentials so every subsequent command authenticates automatically.

**Why it matters:** Manual token management is error-prone and insecure. `gh auth login` handles
OAuth 2.0 device flow, stores tokens in the OS keychain, and transparently refreshes them.
Teams that automate `gh` in CI use the `GH_TOKEN` environment variable instead, but interactive
login is the standard starting point for developer machines. Getting authentication right once
eliminates permission errors for all future commands.

---

### Example 2: Non-Interactive Login with Token

In CI/CD environments or automated scripts, you supply a pre-generated personal access token
through stdin rather than running the interactive browser flow. This is the standard pattern
for headless authentication.

```bash
# Pipe a personal access token directly into gh auth login.
# The --with-token flag reads from stdin, avoiding interactive prompts.
echo "$MY_GITHUB_TOKEN" | gh auth login --with-token
# => (no output on success — token stored in config)

# Alternatively, export GH_TOKEN and gh will use it automatically.
# This requires no login step at all — useful in ephemeral CI containers.
export GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
# => GH_TOKEN is now set in the environment
# => Every gh command in this shell session will use this token
gh auth status
# => github.com
# =>   ✓ Logged in to github.com as your-bot-account (GH_TOKEN)
```

**Key takeaway:** Use `GH_TOKEN` environment variable in CI pipelines; use `--with-token` when
you need to persist credentials in the config file from a script.

**Why it matters:** Hard-coding tokens in scripts is a serious security risk. Piping via stdin
or using environment variables keeps secrets out of command history and process listings.
GitHub Actions provides `${{ secrets.GITHUB_TOKEN }}` automatically — exporting it as `GH_TOKEN`
gives `gh` full API access with zero manual configuration in workflow files.

---

### Example 3: Check Authentication Status

`gh auth status` reports which accounts are currently authenticated, which host they belong to,
and how the token was sourced. It is the diagnostic command you run when `gh` commands return
permission errors.

```bash
# Display authentication status for all configured hosts.
# Reports username, host, token source, and granted scopes.
gh auth status
# => github.com
# =>   ✓ Logged in to github.com account alice (keyring)
# =>   - Active account: true
# =>   - Git operations protocol: https
# =>   - Token: gho_************************************
# =>   - Token scopes: 'gist', 'read:org', 'repo', 'workflow'

# Check status for a specific host (useful with GitHub Enterprise).
gh auth status --hostname github.mycompany.com
# => github.mycompany.com
# =>   ✓ Logged in to github.mycompany.com account alice (keyring)
```

**Key takeaway:** Run `gh auth status` whenever a command returns a 401 or 403 error — it shows
which token is active and whether required scopes are present.

**Why it matters:** Missing OAuth scopes are the most common source of `gh` permission errors.
For example, managing GitHub Actions secrets requires the `workflow` scope, and reading
organization members requires `read:org`. Checking status before debugging saves time by
immediately pinpointing whether the problem is authentication or authorization.

---

### Example 4: Log Out

`gh auth logout` removes stored credentials for a specific host, ensuring tokens are not left
on shared machines or containers after a session ends.

```bash
# Log out from GitHub.com, removing stored credentials.
gh auth logout
# => ? Are you sure you want to log out of github.com account alice? Yes
# => ✓ Logged out of github.com account alice

# Log out without the confirmation prompt (useful in scripts).
gh auth logout --hostname github.com
# => ✓ Logged out of github.com account alice
```

**Key takeaway:** Always run `gh auth logout` on shared or temporary machines after completing
work to prevent unauthorized access to your GitHub account.

**Why it matters:** Leaving authenticated sessions on CI runners, shared developer machines, or
containers is a common security gap. Automated cleanup scripts that call `gh auth logout` at
the end of a job ensure credentials do not persist beyond their intended lifetime.

---

## Repository Operations

### Example 5: Clone a Repository

`gh repo clone` wraps `git clone` with automatic SSH/HTTPS selection based on your `gh auth`
configuration, and accepts the short `owner/repo` format rather than full URLs.

```bash
# Clone using the owner/repo shorthand — no URL needed.
# gh resolves the full URL based on your configured git protocol.
gh repo clone cli/cli
# => Cloning into 'cli'...
# => remote: Enumerating objects: 45231, done.
# => remote: Counting objects: 100% (1203/1203), done.
# => Resolving deltas: 100% (891/891), done.

# Clone into a specific local directory name.
gh repo clone cli/cli my-cli-fork
# => Cloning into 'my-cli-fork'...
# => (same progress output as above)

# Clone and pass additional git flags after the double dash.
gh repo clone cli/cli -- --depth 1
# => Cloning into 'cli'...
# => (shallow clone — only latest commit history)
```

**Key takeaway:** `gh repo clone owner/repo` is faster than constructing full URLs, and
automatically uses your authenticated protocol (HTTPS or SSH).

**Why it matters:** Typing `gh repo clone` instead of finding and copying the full HTTPS or
SSH URL from the browser removes friction from the daily workflow. The `--depth 1` pass-through
pattern is valuable in CI where full history is unnecessary and clone time matters.

---

### Example 6: Create a New Repository

`gh repo create` creates a repository on GitHub and optionally initializes and clones it locally.
It handles visibility, README generation, and `.gitignore` in a single command.

```bash
# Create a new public repository interactively.
gh repo create my-new-project
# => ? What would you like to do? Create a new repository on GitHub from scratch
# => ? Repository name: my-new-project
# => ? Description: My new project
# => ? Visibility: Public
# => ✓ Created repository alice/my-new-project on GitHub
# =>   https://github.com/alice/my-new-project

# Create a private repository non-interactively with all options specified.
gh repo create my-private-app \
  --private \
  --description "Internal application" \
  --add-readme \
  --clone
# => ✓ Created repository alice/my-private-app on GitHub
# => Cloning into 'my-private-app'...
# => (local directory my-private-app now contains the cloned repo)

# Push an existing local repository to a new GitHub repo.
# Run from inside the local git repository directory.
gh repo create alice/existing-project --source=. --public --push
# => ✓ Created repository alice/existing-project on GitHub
# => Branch 'main' set up to track remote branch 'main' from 'origin'.
```

**Key takeaway:** `gh repo create` replaces the three-step process of creating a repo on
GitHub.com, copying the URL, and running `git remote add origin` — all in one command.

**Why it matters:** Reducing repository creation to a single terminal command encourages
developers to create repositories early and often, leading to better version control hygiene.
The `--source=. --push` pattern is particularly valuable when you have started coding locally
before setting up a remote — a workflow that previously required navigating to the GitHub UI.

---

### Example 7: View a Repository

`gh repo view` displays repository metadata, description, topics, and the README directly in
the terminal. Adding `--web` opens the repository in a browser.

```bash
# View the current repository's metadata (run from inside a git repo).
gh repo view
# => alice/my-project
# => No description provided
# =>
# => ★ 0  Watching: 1  Forks: 0
# =>
# => https://github.com/alice/my-project

# View a specific repository by owner/name.
gh repo view cli/cli
# => cli/cli
# => GitHub's official command line tool
# =>
# => ★ 38421  Watching: 382  Forks: 5291
# => Topics: cli, github, go
# =>
# => https://github.com/cli/cli

# View the README content in the terminal.
gh repo view cli/cli --readme
# => (renders the README.md content with terminal formatting)

# Open the repository in your default browser.
gh repo view cli/cli --web
# => Opening github.com/cli/cli in your browser.
```

**Key takeaway:** `gh repo view` gives you repository metadata and README content without
leaving the terminal; `--web` is the fastest way to open any repo in the browser.

**Why it matters:** Quickly checking a dependency's README or star count while staying in
the terminal preserves focus. The `--web` flag provides an escape hatch when you need the
full GitHub UI — for example, to review the repository's Actions tab or browse issues.

---

### Example 8: List Your Repositories

`gh repo list` displays a paginated list of repositories owned by you or a specified user or
organization, with filtering options by visibility and language.

```bash
# List your own repositories (defaults to the authenticated user).
gh repo list
# => NAME                   DESCRIPTION              INFO          UPDATED
# => alice/my-project       My main project          public        about 2 hours ago
# => alice/dotfiles         Shell configuration      public        about 1 day ago
# => alice/private-notes    Personal notes           private       about 3 days ago

# List repositories for a specific user or organization.
gh repo list github
# => NAME                      DESCRIPTION                         INFO      UPDATED
# => github/docs               The open-source repo for docs...   public    about 1 hour ago
# => github/gitignore          A collection of useful .gitignore  public    about 2 days ago

# Filter by visibility and limit results.
gh repo list --public --limit 5
# => (shows up to 5 public repositories)

# Filter by language.
gh repo list --language go --limit 10
# => (shows up to 10 Go repositories)
```

**Key takeaway:** `gh repo list` is the terminal equivalent of browsing your GitHub profile's
repository tab — with flags for filtering by visibility, language, and count.

**Why it matters:** When managing dozens of repositories across an organization, the ability
to filter and script over repository lists enables automation. For example, piping `gh repo list`
output into a loop to clone all repositories in an organization is a common onboarding script
pattern.

---

### Example 9: Fork a Repository

`gh repo fork` creates a fork of a repository under your account and optionally clones it
locally with the upstream remote already configured.

```bash
# Fork a repository and clone it locally in one step.
# --clone clones the fork; upstream remote is set automatically.
gh repo fork cli/cli --clone
# => ✓ Created fork alice/cli
# => Cloning into 'cli'...
# => remote: Enumerating objects: 45231, done.
# => ✓ Cloned fork
# => (current directory is now inside the cloned fork)

# Verify that both origin (fork) and upstream (original) remotes are set.
git remote -v
# => origin    https://github.com/alice/cli.git (fetch)
# => origin    https://github.com/alice/cli.git (push)
# => upstream  https://github.com/cli/cli.git (fetch)
# => upstream  https://github.com/cli/cli.git (push)

# Fork without cloning (creates the fork on GitHub only).
gh repo fork cli/go-gh
# => ✓ Created fork alice/go-gh
# => ! To clone the fork, run: gh repo clone alice/go-gh
```

**Key takeaway:** `gh repo fork --clone` creates the fork, clones it, and sets the upstream
remote in a single command — replacing three manual steps.

**Why it matters:** Setting up the upstream remote correctly is critical for keeping forks
synchronized with the original repository. Forgetting to add the upstream remote is a common
mistake that makes `git fetch upstream` and pull request synchronization impossible. `gh repo
fork --clone` makes the correct setup the default.

---

## Issue Management

### Example 10: Create an Issue

`gh issue create` opens a new issue on a repository, accepting title, body, labels, assignees,
and milestone from flags or an interactive prompt.

```bash
# Create an issue interactively — gh prompts for title, body, and options.
gh issue create
# => ? Title: Fix login button alignment on mobile
# => ? Body: <editor opens>
# => ? What's next? Submit
# => https://github.com/alice/my-project/issues/42

# Create an issue non-interactively with all fields specified.
gh issue create \
  --title "Fix login button alignment on mobile" \
  --body "The login button overlaps the footer on screens < 375px wide." \
  --label "bug,mobile" \
  --assignee alice \
  --milestone "v2.1"
# => https://github.com/alice/my-project/issues/43

# Create an issue and open it in the browser immediately.
gh issue create --title "Add dark mode support" --body "" --web
# => Opening github.com/alice/my-project/issues/new in your browser.
```

**Key takeaway:** `gh issue create` with flags enables scriptable, consistent issue creation
from release notes, error logs, or monitoring alerts.

**Why it matters:** Automating issue creation from CI pipelines or monitoring systems ensures
bugs are tracked immediately. For example, a deployment script can automatically create a
tracking issue when a rollback occurs, linking to the failed commit and attaching logs as the
body — a process that would otherwise require manual intervention.

---

### Example 11: List Issues

`gh issue list` displays open issues filtered by label, assignee, author, or state. It provides
a fast terminal overview without opening the browser.

```bash
# List all open issues for the current repository.
gh issue list
# => Showing 5 of 5 open issues in alice/my-project
# =>
# => ID   TITLE                                  LABELS    UPDATED
# => #43  Add dark mode support                            about 5 minutes ago
# => #42  Fix login button alignment on mobile   bug       about 10 minutes ago
# => #38  Improve test coverage for auth module            about 2 days ago
# => #35  Update dependencies to latest versions           about 3 days ago
# => #30  Document API endpoints                           about 1 week ago

# Filter issues by label.
gh issue list --label "bug"
# => ID   TITLE                                  LABELS  UPDATED
# => #42  Fix login button alignment on mobile   bug     about 10 minutes ago

# List closed issues.
gh issue list --state closed --limit 5
# => (shows up to 5 closed issues)

# Filter by assignee.
gh issue list --assignee alice
# => (shows all issues assigned to alice)
```

**Key takeaway:** Use `--label`, `--assignee`, and `--state` flags to slice the issue list
exactly as you would with GitHub's search syntax, but scriptable in the terminal.

**Why it matters:** Morning standup prep and sprint planning are faster when you can list issues
assigned to you or tagged with a sprint label without context-switching to the browser. Piping
`gh issue list --json number,title` into automation scripts enables triage dashboards and
reporting tools.

---

### Example 12: View an Issue

`gh issue view` displays a single issue's title, body, labels, assignees, comments, and
metadata in the terminal, or opens it in the browser.

```bash
# View issue #42 in the terminal.
gh issue view 42
# => Fix login button alignment on mobile #42
# => Open • alice opened about 10 minutes ago • 0 comments
# =>
# => Labels: bug
# => Assignees: alice
# =>
# => The login button overlaps the footer on screens < 375px wide.
# => Reproduced on iPhone 12 (375px) and Galaxy S21 (360px).

# View the issue including all comments.
gh issue view 42 --comments
# => (full issue content + comment thread)

# Open the issue in the browser.
gh issue view 42 --web
# => Opening github.com/alice/my-project/issues/42 in your browser.
```

**Key takeaway:** `gh issue view` renders the full issue — body and comments — in the terminal,
making it possible to read issue context without a browser.

**Why it matters:** Reading an issue while simultaneously editing code requires switching
windows or tabs. Viewing issues directly in the terminal keeps you in the same context,
especially when using a split terminal layout where one pane shows the issue and another
shows the code under discussion.

---

### Example 13: Close and Reopen an Issue

`gh issue close` and `gh issue reopen` change an issue's state. Closing with a comment
documents the resolution and is more informative than a silent close.

```bash
# Close issue #42 without a comment.
gh issue close 42
# => ✓ Closed issue #42 (Fix login button alignment on mobile)

# Close an issue with a comment explaining the resolution.
gh issue close 42 --comment "Fixed in commit abc1234. Updated CSS media query for < 376px."
# => ✓ Closed issue #42 (Fix login button alignment on mobile)
# => (comment added documenting the fix)

# Reopen a closed issue (for example, if the fix was incomplete).
gh issue reopen 42
# => ✓ Reopened issue #42 (Fix login button alignment on mobile)

# Reopen with an explanatory comment.
gh issue reopen 42 --comment "Bug reappeared after merging PR #55. Reopening for investigation."
# => ✓ Reopened issue #42 (Fix login button alignment on mobile)
```

**Key takeaway:** Always close issues with `--comment` to leave a paper trail; closing silently
loses the context of how and why the issue was resolved.

**Why it matters:** Issue comments are permanent searchable records. A close comment referencing
the fixing commit or PR creates a bidirectional link between the problem and the solution. Six
months later, when the same bug reappears, the comment lets a developer find the original fix
in seconds rather than bisecting through git history.

---

### Example 14: Edit an Issue

`gh issue edit` updates issue metadata — title, body, labels, assignees, or milestone — after
the issue has been created, without opening a browser.

```bash
# Add a label to an existing issue.
gh issue edit 42 --add-label "high-priority"
# => https://github.com/alice/my-project/issues/42
# => (label high-priority added to issue #42)

# Remove a label and add another in the same command.
gh issue edit 42 --remove-label "high-priority" --add-label "in-progress"
# => https://github.com/alice/my-project/issues/42

# Update the title of an issue.
gh issue edit 42 --title "Fix login button alignment on mobile and tablet"
# => https://github.com/alice/my-project/issues/42

# Assign and set a milestone simultaneously.
gh issue edit 42 --add-assignee bob --milestone "v2.2"
# => https://github.com/alice/my-project/issues/42
```

**Key takeaway:** `gh issue edit` accepts multiple flags simultaneously, making bulk metadata
updates scriptable — for example, triaging many issues at once with a shell loop.

**Why it matters:** Sprint planning often requires re-assigning or re-labeling batches of
issues. Running `gh issue edit` in a loop over a list of issue numbers is far faster than
clicking through each issue in the browser, and it is auditable via shell history and git logs.

---

## Pull Request Basics

### Example 15: Create a Pull Request

`gh pr create` opens a pull request from the current branch, inferring the base branch,
repository, and title from git context. It supports draft PRs, reviewers, and labels.

```bash
# Create a PR interactively — gh detects the current branch and suggests a title.
# Run from inside a git repository with a pushed feature branch checked out.
gh pr create
# => ? Title: Fix login button alignment on mobile
# => ? Body: <editor opens>
# => ? What's next? Submit
# => https://github.com/alice/my-project/pull/44

# Create a PR non-interactively with all options.
gh pr create \
  --title "Fix login button alignment on mobile" \
  --body "Resolves #42. Updated CSS media query to target screens < 376px." \
  --base main \
  --reviewer bob,carol \
  --label "bug,css" \
  --assignee alice
# => https://github.com/alice/my-project/pull/45

# Create a draft PR (not yet ready for review).
gh pr create --title "WIP: Add dark mode support" --draft
# => https://github.com/alice/my-project/pull/46
# => (PR created as a draft — reviewers are not notified yet)
```

**Key takeaway:** `gh pr create` with flags replaces the GitHub.com "Compare & pull request"
form and enables scriptable PR creation from CI or release automation.

**Why it matters:** Draft PRs are underused because navigating to GitHub.com to set the draft
checkbox adds friction. `gh pr create --draft` makes draft creation the natural default when
work is still in progress, encouraging developers to open PRs early for discussion and CI
feedback before requesting reviews.

---

### Example 16: List Pull Requests

`gh pr list` shows open pull requests with filtering by label, assignee, author, reviewer,
base branch, and state. It is the fastest way to see the current PR queue.

```bash
# List all open pull requests for the current repository.
gh pr list
# => Showing 3 of 3 open pull requests in alice/my-project
# =>
# => ID   TITLE                                  BRANCH             UPDATED
# => #46  WIP: Add dark mode support             dark-mode          about 5 minutes ago
# => #45  Fix login button alignment on mobile   fix/login-btn      about 10 minutes ago
# => #44  Fix login button alignment on mobile   fix/login-btn-v2   about 15 minutes ago

# List PRs assigned to you.
gh pr list --assignee @me
# => (shows only PRs assigned to the authenticated user)

# List PRs that need your review.
gh pr list --reviewer @me
# => (shows PRs where you are a requested reviewer)

# List closed PRs.
gh pr list --state closed --limit 10
# => (shows the 10 most recently closed PRs)
```

**Key takeaway:** `--assignee @me` and `--reviewer @me` use the special `@me` shorthand to
refer to the authenticated user without hardcoding a username.

**Why it matters:** `gh pr list --reviewer @me` is the fastest morning routine command for
developers doing code review — it shows exactly which PRs need your attention without searching
through the full list. Automating daily review reminders with `gh pr list --reviewer @me --json
number,title` piped to a notification script is a common developer productivity pattern.

---

### Example 17: View a Pull Request

`gh pr view` displays a pull request's full metadata, description, review status, and CI check
summary in the terminal. Adding `--web` opens it in the browser.

```bash
# View the PR for the current branch (auto-detected from git context).
gh pr view
# => Fix login button alignment on mobile #45
# => Open • alice wants to merge 3 commits into main from fix/login-btn
# =>
# => Labels: bug, css
# => Reviewers: bob (Requested)
# => Assignees: alice
# =>
# => Resolves #42. Updated CSS media query to target screens < 376px.

# View a specific PR by number.
gh pr view 45
# => (same output as above)

# View the PR and include all comments.
gh pr view 45 --comments
# => (full PR content + review comments + general comments)

# Open the PR in the browser.
gh pr view 45 --web
# => Opening github.com/alice/my-project/pull/45 in your browser.
```

**Key takeaway:** `gh pr view` gives you the full PR context — description, reviewers, CI
status — without leaving the terminal, useful for quickly checking the state of your own PR.

**Why it matters:** After pushing a commit, developers often check whether CI passed and
whether review was requested correctly. Checking with `gh pr view` instead of navigating to
GitHub.com saves the context switch and keeps you in the terminal where you can immediately
run follow-up commands like `gh pr checks` or `gh pr merge`.

---

### Example 18: Check Out a Pull Request Branch

`gh pr checkout` checks out the branch of a pull request locally, handling the remote
configuration automatically even when the PR comes from a fork.

```bash
# Check out PR #45 by number — switches to the PR's branch.
gh pr checkout 45
# => remote: Enumerating objects: 5, done.
# => remote: Counting objects: 100% (5/5), done.
# => Switched to branch 'fix/login-btn'
# => Branch 'fix/login-btn' set up to track remote branch 'fix/login-btn' from 'origin'.

# Check out a PR from a fork (gh handles the remote setup automatically).
gh pr checkout 50
# => remote: Enumerating objects: 8, done.
# => Switched to branch 'fork-contributor/feature-x'
# => (remote for the fork was automatically added)

# Verify the current branch after checkout.
git branch --show-current
# => fix/login-btn
```

**Key takeaway:** `gh pr checkout` is essential for reviewing and testing PR code locally,
especially for PRs from forks where setting up the remote manually is cumbersome.

**Why it matters:** Testing a PR locally before approving it is a quality practice that
many teams skip because the process of adding a fork remote, fetching, and checking out
the branch is tedious. `gh pr checkout` reduces it to one command, removing the friction
that causes reviewers to approve PRs based on code review alone rather than actually running
the code.

---

### Example 19: Merge a Pull Request

`gh pr merge` merges a pull request into its base branch, with options for merge strategy
(merge commit, squash, or rebase) and automatic branch deletion.

```bash
# Merge PR #45 using the default merge strategy.
# gh will prompt for merge method if not specified.
gh pr merge 45
# => ? What merge method would you like to use? Squash and merge
# => ? Delete the branch locally and on GitHub? Yes
# => ✓ Squashed and merged pull request #45 (Fix login button alignment on mobile)
# => ✓ Deleted branch fix/login-btn and pushed deletion to GitHub

# Merge non-interactively using squash and auto-delete the branch.
gh pr merge 45 --squash --delete-branch
# => ✓ Squashed and merged pull request #45
# => ✓ Deleted branch fix/login-btn and pushed deletion to GitHub

# Merge with a rebase (replays commits on top of the base branch).
gh pr merge 45 --rebase --delete-branch
# => ✓ Rebased and merged pull request #45

# Enable auto-merge: merge automatically when all checks pass.
gh pr merge 45 --auto --squash --delete-branch
# => ✓ Pull request #45 will be automatically merged via squash when all requirements are met.
```

**Key takeaway:** `gh pr merge --auto --squash --delete-branch` is the recommended merge
pattern — it queues auto-merge, enforces a clean history, and cleans up the branch automatically.

**Why it matters:** The `--auto` flag enables merge queuing, which merges the PR the moment all
required status checks pass and approvals are in place, without requiring the author to manually
click merge. Combined with `--delete-branch`, this keeps the repository tidy and removes the
common post-merge cleanup step that teams often forget.

---

## Configuration

### Example 20: Set a Configuration Value

`gh config set` modifies `gh`'s global or per-host configuration, controlling behavior like
the default editor, git protocol, and browser.

```bash
# Set the default editor for gh (used when composing issue/PR bodies).
gh config set editor "code --wait"
# => (editor set to VS Code; --wait makes gh wait until the file is closed)

# Set the preferred Git protocol (https or ssh).
gh config set git_protocol ssh
# => (git clone operations will now use SSH by default)

# Set for a specific hostname (GitHub Enterprise).
gh config set git_protocol https --host github.mycompany.com
# => (HTTPS used for enterprise host; SSH still used for github.com)

# Disable browser opening for auth (useful in headless environments).
gh config set browser ""
# => (no browser will be launched; gh will print URLs instead)
```

**Key takeaway:** `gh config set` controls `gh`'s defaults globally — set these once after
installation to match your preferred editor, protocol, and environment.

**Why it matters:** Setting `git_protocol ssh` once means every `gh repo clone` automatically
uses SSH, avoiding credential prompts for HTTPS. Setting the editor to `code --wait` ensures
PR bodies and issue descriptions open in VS Code with full syntax highlighting rather than a
terminal editor, improving the quality of written communication.

---

### Example 21: Get and List Configuration Values

`gh config get` reads a single configuration value, while `gh config list` displays all
current configuration values. Both are useful for auditing and debugging.

```bash
# Get a single configuration value.
gh config get editor
# => code --wait

# Get the git protocol setting.
gh config get git_protocol
# => ssh

# List all configuration values.
gh config list
# => git_protocol=ssh
# => editor=code --wait
# => browser=
# => prompt=enabled
# => pager=

# Get a value for a specific host.
gh config get git_protocol --host github.mycompany.com
# => https
```

**Key takeaway:** `gh config list` is the first command to run when diagnosing unexpected `gh`
behavior — it shows the full configuration state including any settings that differ from defaults.

**Why it matters:** Configuration drift between developer machines causes inconsistent behavior
in team workflows. Documenting the recommended `gh config` values in an onboarding script or
README, and verifying them with `gh config list`, ensures all team members have matching tool
behavior. This is especially important when some developers use SSH and others use HTTPS.

---

### Example 22: Create an Alias

`gh alias set` creates custom shorthand commands that expand to longer `gh` invocations.
Aliases reduce repetitive typing for frequently used commands.

```bash
# Create an alias for listing your open issues.
gh alias set myissues "issue list --assignee @me"
# => - Adding alias for myissues: issue list --assignee @me
# => ✓ Added alias.

# Use the alias just like any other gh command.
gh myissues
# => ID   TITLE                     LABELS    UPDATED
# => #42  Fix login button issue    bug       about 10 minutes ago

# Create a shell alias (prefixed with !) for more complex operations.
# Shell aliases can run any shell command, not just gh subcommands.
gh alias set prcreate "!git push -u origin HEAD && gh pr create"
# => - Adding alias for prcreate: !git push -u origin HEAD && gh pr create
# => ✓ Added alias.

# List all defined aliases.
gh alias list
# => myissues:  issue list --assignee @me
# => prcreate:  !git push -u origin HEAD && gh pr create

# Delete an alias.
gh alias delete myissues
# => ✓ Deleted alias myissues
```

**Key takeaway:** Use plain aliases for `gh` subcommand shortcuts and shell aliases (with `!`)
for multi-command workflows that combine `git` and `gh` operations.

**Why it matters:** The pattern `!git push -u origin HEAD && gh pr create` is one of the most
valuable `gh` aliases — it pushes your branch and immediately opens the PR creation flow. This
removes the context switch from terminal (to push) to browser (to create PR), and is fast
enough that creating a PR for every small change becomes habitual, improving code review culture.

---

## Additional Beginner Patterns

### Example 23: Add a Comment to an Issue

`gh issue comment` appends a comment to an existing issue, supporting inline text or an editor
for longer responses.

```bash
# Add a comment directly from the command line.
gh issue comment 42 --body "Reproduced on Android 12 as well. Priority should be raised."
# => https://github.com/alice/my-project/issues/42#issuecomment-123456789

# Open an editor to compose the comment body.
gh issue comment 42
# => (editor opens; comment posted when file is saved and closed)

# Add a comment to an issue in a specific repository.
gh issue comment 42 --repo alice/other-project --body "This affects other-project too."
# => https://github.com/alice/other-project/issues/42#issuecomment-123456790
```

**Key takeaway:** `gh issue comment --body` enables scripted issue updates — useful for
automated systems reporting status back to GitHub issues without browser interaction.

**Why it matters:** Automated deployments, test failures, and monitoring alerts can post
updates directly to relevant issues using `gh issue comment`. This creates a centralized
timeline of activity on an issue, linking external system events (CI runs, Datadog alerts)
to the GitHub tracking record.

---

### Example 24: List Repository Collaborators and Topics

Understanding a repository's collaborators and topics helps with discovery and access
management. `gh api` exposes these via the REST API.

```bash
# View repository details including topics from the current repo.
gh repo view --json name,description,repositoryTopics,stargazerCount
# => {
# =>   "name": "my-project",
# =>   "description": "My main project",
# =>   "repositoryTopics": [
# =>     {"name": "typescript"},
# =>     {"name": "nextjs"}
# =>   ],
# =>   "stargazerCount": 12
# => }

# List topics for a specific repository.
gh repo view cli/cli --json repositoryTopics --jq '.repositoryTopics[].name'
# => cli
# => github
# => go
```

**Key takeaway:** Add `--json fieldName` to `gh repo view` to extract machine-readable
structured data; combine with `--jq` to transform it inline.

**Why it matters:** Extracting repository metadata as JSON enables scripting across many
repositories. An organization-wide script can list all repositories, filter by topic, and
generate a formatted report — useful for security audits, dependency analysis, or creating
team portals that aggregate metadata from many repositories.

---

### Example 25: Pin and Unpin Issues

Pinned issues appear at the top of a repository's issue list, highlighting the most important
open items for contributors. `gh issue pin` and `gh issue unpin` manage this.

```bash
# Pin issue #42 to the top of the repository's issue list.
gh issue pin 42
# => ✓ Pinned issue #42 (Fix login button alignment on mobile)

# Unpin the issue when it no longer needs to be highlighted.
gh issue unpin 42
# => ✓ Unpinned issue #42 (Fix login button alignment on mobile)
```

**Key takeaway:** Pin at most three issues — GitHub enforces this limit — to highlight the
most important open items for contributors.

**Why it matters:** Pinned issues are the first thing a new contributor sees when visiting the
issue tracker. Pinning a "Good first issues" meta-issue or a critical bug under investigation
signals project priorities without requiring contributors to read through hundreds of issues.
Repositories with well-maintained pinned issues attract more quality contributions.

---

### Example 26: Transfer an Issue

`gh issue transfer` moves an issue from one repository to another within the same organization
or user account, preserving the conversation history.

```bash
# Transfer issue #42 to a different repository.
# The target repository must be owned by the same user or organization.
gh issue transfer 42 alice/other-project
# => https://github.com/alice/other-project/issues/15
# => (issue #42 is now issue #15 in other-project; original URL redirects)
```

**Key takeaway:** Issue transfers preserve comments and assignees; the original URL automatically
redirects to the new location, so existing links remain valid.

**Why it matters:** As projects evolve, issues are sometimes filed in the wrong repository.
Transferring rather than closing-and-recreating preserves the full discussion history, which
may contain important diagnostic context. The automatic redirect means links in external systems
(Jira, Slack, email) continue to work after the transfer.

---

### Example 27: Lock and Unlock an Issue

`gh issue lock` prevents further comments on an issue, useful when a conversation has become
unproductive. `gh issue unlock` reverses this.

```bash
# Lock issue #42 with an off-topic reason.
# Reason options: off-topic, too heated, resolved, spam
gh issue lock 42 --reason resolved
# => ✓ Locked issue #42

# Unlock the issue to allow further discussion.
gh issue unlock 42
# => ✓ Unlocked issue #42
```

**Key takeaway:** Lock issues when they are resolved and referenced externally — this prevents
new comments from cluttering the thread while keeping the content readable.

**Why it matters:** High-traffic issues for popular repositories often receive redundant
"+1", "me too", or "any update?" comments years after resolution. Locking prevents notification
spam for maintainers and contributors who have subscribed to the issue thread. Using the
`resolved` lock reason signals that the discussion is complete, not that the maintainers
are silencing disagreement.

---

### Example 28: Delete a Repository

`gh repo delete` permanently removes a repository from GitHub. It requires confirmation to
prevent accidental deletion.

```bash
# Delete a repository — this is irreversible.
# gh requires the full owner/repo name to reduce accidental deletions.
gh repo delete alice/test-throwaway
# => ? Type alice/test-throwaway to confirm deletion:
# => alice/test-throwaway
# => ✓ Deleted repository alice/test-throwaway

# Delete without the interactive confirmation prompt (use with extreme caution).
gh repo delete alice/test-throwaway --yes
# => ✓ Deleted repository alice/test-throwaway
# => (no confirmation prompt — dangerous in scripts unless intention is explicit)
```

**Key takeaway:** `gh repo delete` permanently and irrecoverably removes the repository and
all its issues, PRs, releases, and code — only use `--yes` in scripts that explicitly confirm
the correct repository name.

**Why it matters:** Automated cleanup scripts that create temporary repositories for testing
must delete them afterward to avoid accumulating stale repositories. Using the full `owner/repo`
format in the command and validating it against an expected value before calling `--yes`
provides the safety check needed for safe automated cleanup.
