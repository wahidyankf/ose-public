---
description: "Worked examples of correctly isolated git fixtures."
when_to_use: "Use for a concrete example of a properly isolated git fixture."
---

# Examples

## FAIL: The fixture at the center of the motivating incident

`apps/rhino-cli/src/infrastructure/git/root.rs`'s
`find_root_from_worktree_returns_worktree_path` test builds a throwaway repository and a linked
worktree using raw `git` invocations with none of the six layers applied:

```rust
// Excerpt as of this convention's authoring -- none of the six layers applied
Cmd::new("git")
    .args(["init"])
    .current_dir(main)
    .output()
    .expect("git init"); // does NOT check output.status.success()

Cmd::new("git")
    .args(["config", "user.email", "test@test.com"])
    .current_dir(main)
    .output()
    .expect("git config email"); // same gap
```

This is not a hypothetical -- it is the actual fixture behind the repeated real-repository
corruption described in [The Motivating Incident](./the-motivating-incident-repository-corruption.md) above. It has **zero**
structural defense against any of the six layers: no `GIT_CEILING_DIRECTORIES`, no
`GIT_DIR`/`GIT_WORK_TREE`, no `GIT_CONFIG_GLOBAL`/`GIT_CONFIG_SYSTEM`, no pre-write escape guard,
and `.output().expect(...)` does not actually check exit status for the `init`/`config`/`add`/
`commit` calls (only the later `git worktree add` call in the same test checks
`status.success()`). Its dedicated companion plan (see the Motivating Incident section) owns
confirming the exact interacting mechanism and landing the fix in this file; this convention
supplies the durable rule that fix -- and every other git fixture in this monorepo and its
siblings, present and future -- must satisfy. This document does not itself remediate this file.

## PASS: All six layers applied

```rust
fn init_throwaway_repo(tempdir: &Path) -> Result<()> {
    let run_git = |args: &[&str]| -> Result<()> {
        let output = Command::new("git")
            .args(args)
            .current_dir(tempdir)
            .env("GIT_CEILING_DIRECTORIES", tempdir)                 // Standard 1
            .env("GIT_DIR", tempdir.join(".git"))                    // Standard 2 (explicit GIT_DIR)
            .env("GIT_CONFIG_GLOBAL", "/dev/null")                   // Standard 3
            .env("GIT_CONFIG_SYSTEM", "/dev/null")                   // Standard 3
            .output()
            .context("git subprocess failed to spawn")?;
        if !output.status.success() {                                // Standard 5
            anyhow::bail!("git {:?} failed: {}", args, String::from_utf8_lossy(&output.stderr));
        }
        assert_repo_root_is(tempdir)?;                                // Standard 4, after every write
        Ok(())
    };

    run_git(&["init"])?;
    run_git(&["config", "user.email", "fixture@example.test"])?;
    run_git(&["config", "user.name", "Fixture"])?;
    run_git(&["commit", "--allow-empty", "-m", "init"])?;
    Ok(())
}
```

`GIT_WORK_TREE` is intentionally absent (see Standard 2): explicit `GIT_DIR` alone isolates these
writes, and omitting `GIT_WORK_TREE` keeps the same helper usable for a subsequent `git worktree
add <path> HEAD` (which derives the linked worktree from its path argument). Standard 6 -- never
diagnosing this fixture in the primary worktree -- is a process rule and does not appear in the code
sample; see Standard 6 above.
