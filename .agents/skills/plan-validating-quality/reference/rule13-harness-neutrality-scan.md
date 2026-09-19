# Rule 13: Harness-Neutrality Scan (Step 5g — CONDITIONAL)

Run only when the plan touches agents, skills, rules, or `repo-governance/` paths; skip when it
touches only application code and tests. Skipping this check when in scope is **CRITICAL**.

**What to validate**:

1. **Agent definitions follow multi-harness-binding conventions** — frontmatter fields (`name`,
   `description`, `tools`, `model`, `color`, `skills`) present and correctly formatted per
   [AI Agents Convention](../../../../repo-governance/development/agents/ai-agents.md); `color` uses a
   named value (not an OpenCode theme token or hex code); `tools` uses the Claude Code array format.
   Non-conforming agent: **HIGH** per violation.
2. **Agent mirrors are generated, not hand-written** — no step instructs manual editing or direct
   creation of `.opencode/agents/` files. Hand-written secondary binding: **HIGH**.
3. **Skill body is plain markdown** — `SKILL.md` files contain no Claude-Code tool invocations or
   OpenCode-specific YAML beyond skill metadata. Harness-specific syntax in skill body: **HIGH**.
4. **No manual OpenCode skill mirror** — OpenCode reads `.agents/skills/<name>/SKILL.md` natively; no
   `.opencode/skill/` or `.opencode/skills/<name>/` mirror should exist. Manual mirror: **HIGH**.
5. **Governance doc changes outside "Platform Binding Examples" heading** — proposed
   `repo-governance/` content changes live outside any `## Platform Binding Examples` heading unless
   intentionally vendor-specific. Violation: **MEDIUM**.

Reference:
[Multi-Harness Binding Convention](../../../../repo-governance/conventions/structure/multi-harness-binding.md)
and
[Governance Vendor-Independence Convention](../../../../repo-governance/conventions/structure/governance-vendor-independence.md).

**Finding severity**: missing this check when in scope: **CRITICAL**. Hand-written secondary
binding: **HIGH**. Agent frontmatter violation: **HIGH** per violation. Skill body harness-specific
syntax: **HIGH**. Manual OpenCode skill mirror: **HIGH**. Governance change under vendor-specific
heading: **MEDIUM**.
