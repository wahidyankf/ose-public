---
description: The phased rollout plan for adding emoji to existing documentation, and the pre-review validation checklist.
when_to_use: Use when rolling out emoji to existing documentation or doing a final review pass before committing.
---

# Migration Strategy and Validation Checklist

## Migration Strategy

### Updating Existing Documents

When adding emojis to existing documentation:

1. **Start with headings** - Add emojis to H2/H3 headings first
2. **Follow the vocabulary** - Use only emojis from the defined vocabulary
3. **Maintain consistency** - Same emoji for same concept across documents
4. **Don't overdo it** - If a section doesn't benefit from an emoji, skip it
5. **Test scannability** - Review the document to ensure emojis improve (not hinder) navigation

### Phased Rollout

**Phase 1: Core Documentation** (Immediate)

- Update convention documents in `repo-governance/conventions/`
- Update README.md files (root and `.opencode/agents/README.md`)
- Update AGENTS.md and canonical agent files (`.agents/agents/*.md`) per Rule 7 item 5 (emojis enhance scannability for criticality definitions and section headers)
- Update CLAUDE.md and `.agents/skills/*.md` per Rule 7 item 6 (emojis support scannability of guidance and knowledge content)

**Phase 2: Explanation Docs** (Next)

- Update explanation documents in `docs/explanation/`
- Focus on frequently read documents first

**Phase 3: Reference and How-To** (Later)

- Update reference documentation
- Update how-to guides
- Update tutorials

**Phase 4: Plans and Historical Content** (As Needed)

- Update active plans in `plans/in-progress/`
- Update archived plans as they are revisited
- Not urgent for completed/archived content

## PASS: Validation Checklist

When reviewing emoji usage, verify:

- [ ] Emojis are from the defined vocabulary
- [ ] Same emoji = same meaning throughout document
- [ ] 1-2 emojis per section maximum
- [ ] Emojis only in headings (except status indicators)
- [ ] No emojis in code blocks, commands, or file paths
- [ ] No emojis in frontmatter or metadata
- [ ] Emojis ARE used in AGENTS.md (human-readable navigation)
- [ ] Emojis ARE used in canonical agent files `.agents/agents/*.md` (including README.md)
- [ ] Emojis ARE used in CLAUDE.md and `.agents/skills/*.md` (root config and skill files)
- [ ] Emojis ARE used in README.md files (human-oriented indices)
- [ ] Emojis ARE used in docs/, plans/, and repo-governance/ (human documentation)
- [ ] Headings still make sense without emoji (accessibility)
- [ ] Emojis enhance scannability and engagement
