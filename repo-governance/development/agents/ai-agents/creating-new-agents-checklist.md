---
description: "Gives the full checklist (frontmatter, document structure, content quality, convention compliance, information accuracy, file size, testing) for creating a new agent."
when_to_use: Use as the step-by-step checklist while creating a new agent definition file.
---

# Creating New Agents — Agent Creation Checklist

Before submitting a new agent, verify:

## Frontmatter Complete

- [ ] File is flat at `.agents/agents/<name>.md`; `name` matches the filename (kebab-case, no `.md`) and is unique
- [ ] `description` states what the agent does; `when_to_use` states when to use it
- [ ] `tier` is `ultra`, `plan`, `execution`, or `fast`, justified if above `execution`
- [ ] `capabilities` lists only what the agent needs (least privilege), in canonical order
- [ ] `constraints` removes any generated tool the agent must not have (`no-edit`, `no-write`, `no-read`, `no-glob`)
- [ ] `skills` lists the agent skills it uses
- [ ] No `tools`, `model`, `effort`, or `color` key; `./rhino harness adapters generate` renders them
- [ ] `./rhino harness adapters generate` and `./rhino harness adapters validate` both pass

## Document Structure

- [ ] H1 title follows pattern: `# [Name] Agent`
- [ ] Core responsibility/expertise clearly stated
- [ ] Detailed guidelines provided
- [ ] Reference documentation section included

## Content Quality

- [ ] Purpose is clear and specific
- [ ] No significant overlap with existing agents
- [ ] Examples provided for usage
- [ ] Anti-patterns documented (what NOT to do)

## Convention Compliance

- [ ] References `AGENTS.md`
- [ ] References AI agents convention (`ai-agents.md`)
- [ ] References relevant domain conventions
- [ ] Links use correct GitHub-compatible format

## Information Accuracy

- [ ] Agent includes verification requirements for its domain
- [ ] Agent specifies when to use Read/Grep/Glob for verification
- [ ] Agent specifies when to use WebSearch/WebFetch for verification
- [ ] Agent emphasizes verification over assumptions
- [ ] Agent provides examples of good vs bad verification practices

## File Size Compliance

- [ ] Agent passes the word-budget gate (`./rhino governance word-budget validate`)
- [ ] If approaching warning threshold, consider condensation strategies
- [ ] Verified no duplication with convention docs (link instead)

## Testing

- [ ] Manually tested agent invocation
- [ ] Verified tool permissions are sufficient
- [ ] Confirmed no tool permission creep
- [ ] Verified model selection is appropriate

**Same-session invocation gap**: a generated `.claude/agents/<name>.md` route created earlier in the current
session is not guaranteed to appear in the Agent tool's available `subagent_type` list — that list
is populated at session/process start, not from a live directory read. A plan that authors a new
agent and needs to invoke it within the same run (e.g., wiring a freshly created review agent into
a later phase) should not treat an unlisted `subagent_type` as a broken agent. **Workaround**:
invoke `general-purpose` and instruct it, as its first step, to `Read` the new canonical `.agents/agents/<name>.md` file in
full and follow its instructions verbatim, then perform the task — this reproduces the target
agent's behaviour without requiring session-level registration.
