---
description: The full scope rule for where emojis are allowed versus forbidden, with rationale.
when_to_use: Use to check whether a file type (docs, agents, config, README) may contain emoji.
---

# Emoji Usage Rule 7: Scope - Where to Use Emojis

**Emojis enhance scannability and engagement in human-readable files.**

**PASS: USE emojis in these files:**

1. **All documentation** - `docs/**/*.md`
   - Explanations, tutorials, how-tos, reference
   - Conventions, development docs

2. **Governance documentation** - `repo-governance/**/*.md`
   - Principles, conventions, development practices
   - Workflows, architecture documentation

3. **All README files** - `**/README.md`
   - Root README.md
   - Index files in any directory (human-oriented overviews)
   - Including `.opencode/agents/README.md` (agent index for humans)

4. **Planning documents** - `plans/**/*.md`
   - Project plans, requirements, technical docs
   - Human-readable working documents

5. **Agent configuration files** - AGENTS.md, canonical agent files, generated agent routes
   - AGENTS.md - Human-readable navigation document for developers
   - Canonical agent files (`.agents/agents/*.md`) - Agent definitions (source of truth) read by developers to understand agent behaviour
   - Generated agent routes (`.claude/agents/*.md`, `.opencode/agents/*.md`) carry no body text of their own, so emoji rules do not apply to them
   - Emojis enhance scannability for:
     - Criticality level definitions (CRITICAL, HIGH, MEDIUM, LOW)
     - Section headers (Purpose, Key Concepts, Reference)
     - Status indicators in examples (PASS: Correct, FAIL: Incorrect, Warning)

6. **Root configuration and skill files** - CLAUDE.md, canonical skill files
   - CLAUDE.md - Project guidance document for coding agent sessions, human-readable
   - Canonical skill files (`.agents/skills/*.md`) - Skill files providing knowledge and execution services to agents
   - Emojis support scannability of guidance and knowledge content read by developers

**FAIL: DO NOT use emojis in these files:**

1. **Configuration files**
   - `*.json`, `*.yaml`, `*.toml`
   - `package.json`, `tsconfig.json`, etc.
   - `.gitignore`, `.gitattributes`
   - `.github/workflows/*.yml`

**Rationale:**

**Enhanced scannability:**

- AGENTS.md is a human-readable navigation document that benefits from emoji-enhanced scannability
- Agent files are human-readable specifications - developers read them to understand behaviour, patterns, workflows
- Emojis provide semantic visual markers that help developers quickly locate sections (criticality, purpose, references)

**Consistency with referenced content:**

- Agent files reference agent skills and conventions that use emojis (e.g., criticality definitions with 🟠🟡🟢)
- Agent definitions should be visually consistent with their referenced content
- When agents display emoji-based definitions in their own documentation, it maintains semantic consistency

**Why agent files now get emojis:**

- Agent files are specifications for both humans (developers) AND AI (execution)
- Developers read agent files to understand behaviour, patterns, and workflows
- Emojis enhance scannability without changing agent execution logic
- Similar to how docs/\*_/_.md use emojis for human scannability

PASS: **Clear rule:**

```
Emojis for humans: docs/, repo-governance/, plans/, README.md files, CLAUDE.md, .agents/skills/*.md
Emojis for agents: AGENTS.md, .agents/agents/*.md
No emojis for machines: config files (*.json, *.yaml, *.toml)
```
