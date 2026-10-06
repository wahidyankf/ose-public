# Factual Validation — Integration with Checker Agents

## Dual-Label Pattern

Factual validation findings require BOTH verification label AND criticality level:

```markdown
### 1. [Error] - Command Syntax Incorrect in Installation Guide

**File**: `docs/tutorials/quick-start.md:42`
**Verification**: [Error] - Command syntax verified incorrect via WebSearch
**Criticality**: CRITICAL - Breaks user quick start experience
**Category**: Factual Error - Command Syntax

**Finding**: [description]
**Impact**: [consequences]
**Recommendation**: [fix]
**Verification Source**: [URL]
**Confidence**: HIGH
```

**Why dual labels?**

- **Verification** ([Verified]/[Error]/[Outdated]/[Unverified]) describes FACTUAL STATE
- **Criticality** (CRITICAL/HIGH/MEDIUM/LOW) describes URGENCY/IMPORTANCE

Both dimensions provide complementary information.

## Confidence Assessment

**HIGH confidence** when:

- Official documentation clearly contradicts claim
- Package registry shows version doesn't exist
- Code example fails to compile (verified locally)
- Multiple authoritative sources agree

**MEDIUM confidence** when:

- Sources partially contradict (some say yes, some say no)
- Claim is version-specific but version unclear
- Documentation ambiguous or incomplete
- Cannot find definitive authoritative source

## Factual Validation Agents

Three agents implement this methodology end-to-end (check → finding → fix):

- **docs-checker** — Validates documentation factual accuracy
- **docs-tutorial-checker** — Validates tutorial factual accuracy
- **content-checker** — Validates ayokoding-web factual accuracy

All use the same validation workflow and confidence classification.

## Delegate Research to `web-researcher` for Context Isolation

The authoritative rule for when to delegate public-web research lives in the
[Web Research Delegation Convention](../../../../repo-governance/conventions/writing/web-research-delegation.md).
This skill follows that convention and does not re-state the threshold here. In summary: delegate to
`web-researcher` whenever verifying a single claim requires 2+ `WebSearch` calls or 3+ `WebFetch` calls;
in-context work remains correct for single-shot verification against a known authoritative URL and for
fixer agents re-validating a single audit finding.

**Delegation pattern:**

```
Agent tool call → subagent_type: web-researcher
Prompt: "Verify whether <specific claim>. Return cited findings with confidence tags."
```

`web-researcher` returns a synthesised, cited summary using the same `[Verified]/[Outdated]/[Unverified]/[Needs Verification]` confidence tags defined in this skill. You then translate those tags into dual-labelled findings (`[Verified]/[Error]/[Outdated]/[Unverified]` + `CRITICAL/HIGH/MEDIUM/LOW`) for your audit report.

See [`web-researcher`](../../../agents/web-researcher.md) for the agent contract and the
[Web Research Delegation Convention](../../../../repo-governance/conventions/writing/web-research-delegation.md)
for the normative rule and its enumerated exceptions.
