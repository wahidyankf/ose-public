# SWE Code Checker: Regression and Fixture Isolation

Regression-test mandate and git-fixture isolation — run for every code change or project under review.

## Regression Test Mandate (Bug/Regression Fixes)

Reference: [Regression Test Mandate](../../../repo-governance/development/quality/regression-test-mandate.md).

A `fix(...)` commit or any diff correcting wrong observable behaviour MUST land with a reproducing
test in the same change set (fails before the fix, passes after) — blocking, no exemption, applies
to every defect type including cosmetic/visual. Form adapts to the defect: behavioural/functional →
a `specs/**` Gherkin scenario plus the consuming unit/integration/e2e test (per the
[Behaviour-Driven Development](../../../../repo-governance/development/behaviour-driven-development.md));
visual/design/UI → a DOM/computed-style or component test (or a Gherkin scenario for the on-design
expectation); content/copy/i18n → a test asserting the corrected string/translation. HIGH when
missing — unlike specs completeness, the pure-refactor exemption never applies (a fix by definition changes
behaviour to correct it).

## Git Fixture Isolation

Reference: [Git Fixture Isolation Convention](../../../repo-governance/development/quality/git-fixture-isolation.md).

For any test/fixture (any language) invoking a raw `git` subprocess to create or mutate a
**throwaway** repository (`git init`, `commit`, `config`, `worktree add`, `branch`, `checkout -b`,
`reset --hard`, or equivalents), verify all six mandatory isolation layers: (1)
`GIT_CEILING_DIRECTORIES` set to the fixture's temp root; (2) explicit `GIT_DIR` set — no reliance
on `current_dir()`/process CWD (`GIT_WORK_TREE` is context-dependent, not mandatory — it must be
_absent_ for `git worktree add` and the escape guard, so its absence alone is never a finding); (3)
`GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CONFIG_SYSTEM=/dev/null`; (4) a pre-write escape guard
(canonicalized `git rev-parse --show-toplevel` compared against the intended tempdir, failing loud
on mismatch) before every write subcommand; (5) a real exit-status check
(`status.success()`/language equivalent) on every `git` subprocess — a bare `.expect()`/try-catch
around the spawn alone does not satisfy this, since it only catches spawn failures, not `git`
itself returning non-zero; (6) never diagnosing this fixture class in the primary/real worktree
(throwaway clone only) — a process rule, out of scope for static checks.

Starting grep: `rg -l 'Command::new\("git"\)|exec\.Command\("git"|child_process\.(spawn|exec(File)?)\("git"|subprocess\.(run|Popen)\(\s*\[?"git"|ProcessStartInfo\(.*"git"' -g '*test*' -g '*fixture*' -g '*spec*'`
— for each match, confirm layers 1-5 appear in the same function or a shared helper it calls.

**Criticality**: CRITICAL — this is the exact gap class that let a real fixture repeatedly corrupt
the primary repository (stray commits on the real branch, overwritten local git identity) in the
motivating incident. Missing isolation layers are a live data-loss/repo-corruption risk, not style.
