# RTK - Rust Token Killer (Codex CLI)

**Usage**: Token-optimized CLI proxy for shell commands.

## Rule

Always prefix shell commands with `rtk`.

Examples:

```bash
rtk git status
rtk cargo test
rtk npm run build
rtk pytest -q
```

## Meta Commands

```bash
rtk gain            # Token savings analytics
rtk gain --history  # Recent command savings history
rtk proxy <cmd>     # Run raw command without filtering
```

## Verification

```bash
rtk --version
rtk gain
which rtk
```

## Known Issues

**Git refused in a worktree**: `rtk hook claude`'s PreToolUse guard (reproduced on rtk 0.43.0; not
fixed in any released version as of 2026-09-16) refuses every real git subcommand when the working
directory is a git worktree, always claiming the session "is isolated in the worktree `<path>`"
even when that path is correct. Trivial invocations (`git --version`/`--help`) still pass. Upstream:
[rtk-ai/rtk#3864](https://github.com/rtk-ai/rtk/issues/3864), fix pending in
[rtk-ai/rtk#3879](https://github.com/rtk-ai/rtk/pull/3879) (unmerged). Workaround: invoke git via
its absolute path (e.g. `/usr/bin/git`, resolve with `which git`) instead of bare `git`/`rtk git` —
this bypasses the guard entirely. Remove this note once a released rtk version includes the #3879
fix.
