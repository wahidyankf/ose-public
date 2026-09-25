---
description: "KPI, test name, agent, CLI flag fabrication."
when_to_use: "Use as a checklist for AP-5 - AP-8."
---

# Anti-Pattern Catalog: AP-5 through AP-8

## AP-5: Fabricating a numeric KPI

> "This change reduces review time by 35%..."

If no baseline measurement exists, the number is fiction. Acceptable rewrites: `_Judgment call:_ we expect review time to drop`, or `Observable check: zero unsolicited PR-creation steps in audited plans after migration`.

## AP-6: Inventing a test name

> "Add test `Cache_RevalidatesOnTagInvalidation` to `cache.test.ts`..."

If the test does not exist yet, the plan must say `_New test_`. If the file does not exist yet, it must say `_New file_`. Otherwise the executor will look for a non-existent test and either fabricate it or stall.

## AP-7: Citing an agent or skill that does not exist

> "Delegate to `swe-rust-dev`..."

The agent must resolve via `test -f .agents/agents/<name>.md` (agent definitions live flat in
`.agents/agents/`, e.g. `.agents/agents/swe-rust-dev.md`). List the directory first or check the
[agent index](../../../../.agents/agents/README.md).

## AP-8: Citing a CLI flag without `--help`

> "Run `nx affected -t lint --parallel=cores-1`..."

The `--parallel` flag may or may not accept `cores-1` — check `nx --help` or repository docs. The
repository standard is the fixed allocation supplied by the guarded consumer: omit a hard-coded
flag when Nx reads `NX_PARALLEL`, or pass only a verified supported numeric value.
