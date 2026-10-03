---
description: "How this convention is enforced across checker/fixer agents."
when_to_use: "Use when locating the automated enforcement for git-fixture isolation."
---

# Enforcement

- **`swe-reviewer`**: Locates test/fixture files that shell out to a raw `git` invocation
  (`Command::new("git")` in Rust, `exec.Command("git"` in Go, `child_process.spawn/exec("git"` in
  TypeScript, `subprocess.run/Popen([...,"git"` in Python, `ProcessStartInfo` targeting `git` in
  F#/.NET) and verifies all six layers are present -- the four mandatory isolation env vars
  (`GIT_CEILING_DIRECTORIES`, `GIT_DIR`, `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`) set on or near the
  invocation, a pre-write escape-guard call before write subcommands, and an exit-status check that
  actually inspects `status.success()` (not a bare `.expect()` on the `Output` value).
  `GIT_WORK_TREE` is context-dependent, not mandatory: it must be **absent** for `git worktree add`
  and for the escape guard (see Standard 2), so its absence is never on its own a finding. A fixture
  missing any of the four mandatory env vars, the escape guard, or the exit-status check is a finding.

  **Criticality**: **CRITICAL** -- per the
  [Criticality Levels Convention](.././criticality-levels.md), this maps to "data loss risks" and
  "violations of MUST requirements in conventions." A missing layer here is not a style deviation;
  it is the exact gap that let a real incident corrupt the primary repository.

  A grep-based heuristic for locating candidates:

  ```bash
  rg -l 'Command::new\("git"\)|exec\.Command\("git"|child_process\.(spawn|exec(File)?)\("git"|subprocess\.(run|Popen)\(\s*\[?"git"|ProcessStartInfo\(.*"git"' \
    -g '*test*' -g '*fixture*' -g '*spec*'
  ```

  For each match, verify the five isolation env vars, the escape-guard call, and a real
  `status.success()`-style check all appear in the same function or in a shared helper the
  function calls.

- **`rules-checker`**: May additionally audit that this convention itself stays cross-referenced
  from [Regression Test Mandate](.././regression-test-mandate.md),
  [Behaviour-Driven Development](../../behaviour-driven-development.md), and
  [Reproducible Environments Convention](../../workflow/reproducible-environments.md), per
  the standard convention-integration checklist.
