---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Software Testing](../software-testing/learning/overview.md) -- verifying an
  agent's output leans directly on writing and running the tests that catch a wrong generation; [Software Engineering Practices](../software-engineering-practices/learning/overview.md) -- code
  review, small commits, and working in trunk are exactly the discipline this topic applies to an
  agent's output instead of a human's.
- **Tools & environment**: an AI coding agent/assistant (editor-integrated and/or CLI); a
  version-controlled repo for safe, reversible iteration; a fast test suite as the verification
  harness; Neovim/VSCode with the agent integration.
- **Assumed knowledge**: writing and running tests to verify a change (topic 15); code review, small
  commits, and working in trunk (topic 30); reading code in more than one language (the earlier
  primers) -- this topic is polyglot, so several worked examples show Python, Bash, TypeScript, or
  Gherkin, not one fixed language.

## Why this exists -- the big idea

**The problem before the solution**: an agent will produce plausible, confident, wrong code fast --
used naively it accelerates the creation of bugs and quietly erodes the author's understanding of
their own codebase. **The one idea worth keeping if you forget everything else**: the agent drafts,
you verify -- treat generated code as an untrusted contribution that must pass the same tests,
review, and reasoning as any other, and keep a tight loop where you check before you build on it.

**Cross-cutting big ideas, taught here and then reused for the rest of this curriculum**:
`correctness-vs-pragmatism` -- agents are a pragmatism engine, enormous leverage on the routine, but
correctness stays your job via tests and review, not the model's; `determinism-vs-emergence` -- the
same prompt yields different output, so you manage a non-deterministic collaborator with context,
constraints, and verification rather than expecting a repeatable function.

## Tensions & trade-offs -- when NOT to reach for this

- **Speed vs. understanding**: delegating the code you most need to understand -- the tricky core --
  trades short-term velocity for long-term ignorance of your own system. Verify most where it matters
  most; delegate most where it matters least.
- **Automation bias is the real risk**: a fluent, confident answer invites you to skip the review it
  most needs -- the tool's persuasiveness is inversely correlated with your scrutiny unless you force
  the loop.
- **When NOT**: high-stakes, novel, or security-critical logic, and any situation where you can't
  cheaply verify the output -- if you can't test or review it fast, the agent's speed is a liability,
  not an asset.

## Lineage -- why it beat the alternative

Assisted coding evolved from autocomplete to snippet generators to agents that read a repo, plan, edit,
run tests, and iterate -- the ReAct pattern (interleaved reasoning and acting) and chain-of-thought
prompting are the research lineage that made the tool loop practical. It won over pure hand-coding for
routine work because the leverage on boilerplate, mechanical refactors, and first drafts is large --
but only under the discipline this topic teaches, which is exactly why testing (topic 15) and
engineering practice (topic 30) are hard prerequisites. This skill is the _user's_ side of agents; the
_builder's_ side -- how agents are constructed -- is a later topic in this curriculum's AI band, which
flips the perspective from using agents to building them.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 54 recorded-session and config worked examples across
  Beginner (Examples 1-18: what agentic coding is and is not, the perceive/plan/act/observe loop,
  context-window budgeting and pruning, well-specified prompts, instruction files, first-tool-call
  discipline, plan mode, running the suite before accepting, spotting a hallucinated API, and
  calibrating how closely to review), Intermediate (Examples 19-40: MCP servers and JSON-RPC tool
  calls, subagent delegation and fan-out, permission/deny configs, sandboxing and reversible commits,
  test-driven agent workflows, diff-review discipline, token budgeting, prompt-injection guardrails,
  agent skills, spec-driven development, and iterative correction loops), and Advanced (Examples
  41-54: escalating security-critical changes, refusing unverifiable output, human decision gates,
  context-managed multi-file loops, mechanical refactors with per-file approval, catching a
  confidently wrong refactor, trust/verify decision logs, MCP-plus-subagent research, guardrail
  configuration, spec-driven TDD, a full verify-first session, cost-bounded refinement, and an agent
  merge post-mortem) -- plus an intra-topic capstone that lands one real feature under a verify-first
  discipline.

Every code-medium example is a complete, self-contained, runnable file colocated under
`learning/code/`, actually executed to capture its documented output. Every artifact-medium example
(a recorded prompt, session transcript, or config with no runnable code) also lives standalone under
`learning/artifacts/` -- this topic is polyglot and workflow-shaped: the target language and artifact
format vary by example, the perceive-plan-act-observe loop and the verify-before-you-build-on-it
discipline do not.

---

Next: [Learning Overview](./learning/overview.md) →
