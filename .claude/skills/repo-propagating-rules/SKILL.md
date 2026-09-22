---
description: |-
  Run the rules-propagation workflow whenever a repository rule is being created, updated, superseded, or deleted. TRIGGERS on "add rule", "new rule", "update the rule", "change the convention", "adjust the rule", "delete that rule", "make it a rule that…", "from now on we should…", "we should always/never…", or any request that would edit repo-governance/, AGENTS.md, CLAUDE.md, an agent or skill definition, repo-config.yml, a hook, or a CI workflow. Load it BEFORE editing any of those surfaces, not after.
name: repo-propagating-rules
---

Read .agents/skills/repo-propagating-rules/SKILL.md completely, resolve every relative resource from that skill directory, and follow it as authoritative before acting.
