---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Software Testing](../../software-testing/learning/overview.md) --
  verifying an agent's output leans directly on writing and running the tests that catch a wrong
  generation; [Software Engineering Practices](../../software-engineering-practices/learning/overview.md) -- code review, small
  commits, and working in trunk are exactly the discipline this topic applies to an agent's output
  instead of a human's.
- **Tools & environment**: an AI coding agent/assistant (editor-integrated and/or CLI); a
  version-controlled repo for safe, reversible iteration; a fast test suite as the verification
  harness; Neovim/VSCode with the agent integration. Code-medium examples use Python 3.13
  (standard-library-only), POSIX Bash, TypeScript, and Gherkin -- each example states which.
- **Assumed knowledge**: writing and running tests to verify a change (topic 15); code review, small
  commits, and working in trunk (topic 30); reading code in more than one language (the earlier
  primers).

## Why this exists -- the big idea

**The problem before the solution**: an agent will produce plausible, confident, wrong code fast --
used naively it accelerates the creation of bugs and quietly erodes the author's understanding of
their own codebase. **The one idea worth keeping if you forget everything else**: the agent drafts,
you verify -- treat generated code as an untrusted contribution that must pass the same tests,
review, and reasoning as any other, and keep a tight loop where you check before you build on it.

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-18) -- what agentic coding is (and is not), the
  perceive/plan/act/observe loop, context-window budgeting and pruning, writing a well-specified
  prompt, instruction files and their precedence, first-tool-call and tool-call-log discipline, plan
  mode before act mode, running the suite before accepting a diff, spotting a hallucinated API, and
  calibrating how closely to review delegated work.
- **[Intermediate](./intermediate.md)** (Examples 19-40) -- configuring and calling an MCP server,
  delegating to a subagent and fanning out two in parallel, permission deny/allow-list configs,
  sandboxed shell commands and small reversible commits, driving a full red-green-refactor cycle with
  an agent, diff-review checklists and catching scope creep, budgeting and comparing prompt cost,
  probing and sanitizing against prompt injection, loading and comparing against an agent skill,
  writing a spec before prompting (including a Gherkin-driven implementation), and iterating on a
  failed first attempt across multiple rounds.
- **[Advanced](./advanced.md)** (Examples 41-54) -- escalating a security-critical change, declining
  to delegate a genuinely novel algorithm, refusing unverifiable output, a mid-session human decision
  gate, a context-managed multi-file feature loop, a mechanical refactor across files with per-file
  approval, catching a confidently wrong refactor via a regression test, a full trust/verify decision
  log, an MCP-plus-subagent research task, a prompt-injection guardrail configuration, a spec-driven
  TDD session, a full verify-first feature session, cost-bounded iterative refinement, and a
  post-mortem of a bad agent merge.
- **[Capstone](./capstone/overview.md)** -- one real feature (`parse_duration`), landed under a
  verify-first discipline: a specified prompt with a failing tripwire test, a driven session that
  catches and rejects one genuinely wrong generation before reaching green, and a written trust/verify
  decision log.

Every code-medium example is a complete, self-contained, runnable file colocated under
`learning/code/`, actually executed to capture its documented output -- every printed transcript on
this topic's pages is genuine, never fabricated. Every artifact-medium example (a recorded prompt,
session transcript, or config with no runnable code) also lives standalone under `learning/artifacts/`
-- this topic is polyglot and workflow-shaped: the target language and artifact format vary by
example, the loop and the verify-before-you-build-on-it discipline do not.

## The 24 concepts this topic covers

- **co-01 · What is agentic coding** -- an agent that autonomously reads a repo, plans, edits, runs
  tools, and iterates, distinct from single-shot autocomplete or snippet generation. Example 1.
- **co-02 · The perceive/plan/act/observe loop** -- coding agents run an interleaved
  reasoning-and-acting loop (ReAct-style): observe state, reason about the next step, act via a tool,
  then observe the result before reasoning again. Example 2.
- **co-03 · Context-window fundamentals** -- the agent reasons only within a finite context-window
  budget, so what is or is not loaded directly shapes output quality. Example 3.
- **co-04 · Context management** -- deliberately curating what enters the context window and
  pruning what does not, since more context is not always better. Examples 4, 45.
- **co-05 · Prompting for code** -- a well-specified prompt states the goal, constraints, examples,
  and acceptance criteria up front rather than leaving them implicit. Examples 5, 6, 52.
- **co-06 · Instruction files** -- a persistent, repo-level file (AGENTS.md/CLAUDE.md) the agent
  reads automatically to learn build/test commands and conventions without being re-told each
  session. Examples 7, 8.
- **co-07 · Tool use and function calling** -- the agent acts by invoking discrete named tools with
  structured parameters rather than free-form text output. Examples 9, 10.
- **co-08 · MCP (Model Context Protocol)** -- an open, JSON-RPC-based protocol standardizing how a
  host application connects an agent to external tools, resources, and prompts across vendors.
  Examples 19, 20, 49.
- **co-09 · Plan mode vs. act mode** -- separating a read-only exploration/planning phase from a
  write-enabled execution phase, with an explicit approval step between them. Examples 11, 12, 52.
- **co-10 · Subagents and orchestration** -- delegating a bounded sub-task to an isolated agent
  context so its exploration detail stays out of the main conversation and only a summary returns.
  Examples 21, 22, 45, 49.
- **co-11 · Permissions and guardrails** -- explicit allow/deny/ask rules constraining which tools,
  paths, or commands an agent may use, enforced by the harness rather than the model. Examples 23,
  24, 50.
- **co-12 · Sandboxing and reversibility** -- isolating risky agent actions and preferring small,
  independently revertable steps over one large change. Examples 25, 26.
- **co-13 · Verification discipline** -- reading, running the test suite, and reviewing the diff
  before building on any agent output. Examples 13, 43, 47, 52, 54.
- **co-14 · Test-driven agent workflows** -- giving the agent a failing test as the acceptance bar
  and driving it to green through a red-green-refactor cycle. Examples 27, 28, 51.
- **co-15 · Diff review** -- applying the same code-review scrutiny to an agent-generated diff as to
  any human contribution before accepting it. Examples 14, 29, 30, 46, 52.
- **co-16 · Hallucination awareness** -- an agent can generate plausible, confident, and entirely
  nonexistent APIs or behavior, which only verification against a real source catches. Examples 15,
  47, 54.
- **co-17 · Trust-vs-verify calibration** -- deciding, task by task, which work is safe to delegate
  lightly versus which demands close human review. Examples 16, 17, 46, 48.
- **co-18 · Cost and token budgeting** -- an agent session consumes tokens/cost per turn, so
  multi-turn iterative work needs an explicit budget and stopping condition. Examples 18, 31, 32, 53.
- **co-19 · Prompt-injection risk** -- untrusted content the agent reads can embed instructions that
  hijack the agent's goal unless guarded against. Examples 33, 34, 50.
- **co-20 · Agent skills** -- a packaged, filesystem-based procedure the agent loads on demand
  instead of re-deriving or re-pasting the same guidance each session. Examples 35, 36.
- **co-21 · Spec-driven development** -- writing an executable specification and acceptance criteria
  first, then using the agent to implement against that spec rather than an ad hoc prompt. Examples
  37, 38, 51.
- **co-22 · When not to use agents** -- high-stakes, novel, or cheaply-unverifiable work where
  delegating would trade understanding and safety for speed the situation cannot afford. Examples 41,
  42, 43, 54.
- **co-23 · Iterative refinement** -- treating agent output as a multi-round correction loop rather
  than expecting one-shot correctness. Examples 39, 40, 53.
- **co-24 · Human-in-the-loop** -- keeping an explicit human decision point at every risky boundary
  in a session rather than granting the agent full autonomy end to end. Examples 41, 44, 48, 53.

## Examples by level

### Beginner (Examples 1-18)

- [Example 1: What Agentic Coding Is Not](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-1-what-agentic-coding-is-not)
- [Example 2: Trace the Agent Loop](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-2-trace-the-agent-loop)
- [Example 3: Context-Window Budget Check](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-3-context-window-budget-check)
- [Example 4: Prune Irrelevant Context](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-4-prune-irrelevant-context)
- [Example 5: Minimal Well-Specified Prompt](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-5-minimal-well-specified-prompt)
- [Example 6: Vague vs. Specific Prompt Contrast](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-6-vague-vs-specific-prompt-contrast)
- [Example 7: Author a Project Instruction File](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-7-author-a-project-instruction-file)
- [Example 8: Instruction-File Precedence](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-8-instruction-file-precedence)
- [Example 9: First Tool Call Is a Read](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-9-first-tool-call-is-a-read)
- [Example 10: Tool-Call Log Inspection](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-10-tool-call-log-inspection)
- [Example 11: Plan-Mode First Pass](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-11-plan-mode-first-pass)
- [Example 12: Act-Mode After Plan Approval](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-12-act-mode-after-plan-approval)
- [Example 13: Run the Suite Before Accepting](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-13-run-the-suite-before-accepting)
- [Example 14: Reject a Diff on Inspection](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-14-reject-a-diff-on-inspection)
- [Example 15: Spot a Hallucinated API](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-15-spot-a-hallucinated-api)
- [Example 16: Delegate Boilerplate Safely](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-16-delegate-boilerplate-safely)
- [Example 17: Require Close Review for Sensitive Code](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-17-require-close-review-for-sensitive-code)
- [Example 18: Token-Usage-per-Turn Log](/en/c/learn/courses/agentic-coding/learning/beginner#worked-example-18-token-usage-per-turn-log)

### Intermediate (Examples 19-40)

- [Example 19: Adding an MCP Server to a Project's Config](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-19-adding-an-mcp-server-to-a-projects-config)
- [Example 20: Calling a Tool via MCP](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-20-calling-a-tool-via-mcp----the-json-rpc-requestresult-pair)
- [Example 21: Delegating to a Subagent](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-21-delegating-to-a-subagent----only-the-summary-returns)
- [Example 22: Parallel Subagent Fan-Out on Two Unrelated Subtasks](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-22-parallel-subagent-fan-out-on-two-unrelated-subtasks)
- [Example 23: A Deny Rule Scoping Writes to One Subdirectory](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-23-a-deny-rule-scoping-writes-to-one-subdirectory)
- [Example 24: A Read-Only Allow-List for a Review-Only Session](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-24-a-read-only-allow-list-for-a-review-only-session)
- [Example 25: A Sandboxed Shell Command Stays Isolated from the Host](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-25-a-sandboxed-shell-command-stays-isolated-from-the-host)
- [Example 26: Four Small Commits, One Independently Reverted](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-26-four-small-commits-one-independently-reverted)
- [Example 27: A Failing Test as a Tripwire](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-27-a-failing-test-as-a-tripwire)
- [Example 28: Red-Green-Refactor, Driven by the Agent, in Three Diffs](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-28-red-green-refactor-driven-by-the-agent-in-three-diffs)
- [Example 29: A Scope/Tests/Style Diff-Review Checklist](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-29-a-scopetestsstyle-diff-review-checklist)
- [Example 30: Catching Silent Scope Creep in a Diff](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-30-catching-silent-scope-creep-in-a-diff)
- [Example 31: A TurnBudget That Halts at Its Ceiling](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-31-a-turnbudget-that-halts-at-its-ceiling)
- [Example 32: Scoped vs. Open-Ended Prompt](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-32-scoped-vs-open-ended-prompt----the-cost-comparison)
- [Example 33: An Untrusted-Content Injection Probe](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-33-an-untrusted-content-injection-probe)
- [Example 34: Sanitizing Fetched Tool Output Before Reuse](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-34-sanitizing-fetched-tool-output-before-reuse)
- [Example 35: Loading an Agent Skill Instead of Improvising](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-35-loading-an-agent-skill-instead-of-improvising)
- [Example 36: Skill-Loaded vs. Ad Hoc](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-36-skill-loaded-vs-ad-hoc----the-repeatability-test)
- [Example 37: Writing the Spec Before Writing the Prompt](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-37-writing-the-spec-before-writing-the-prompt)
- [Example 38: A Gherkin Scenario Driving a Small Implementation](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-38-a-gherkin-scenario-driving-a-small-implementation)
- [Example 39: Iterating on a Failed First Attempt](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-39-iterating-on-a-failed-first-attempt)
- [Example 40: A Three-Round Correction Loop, Converging](/en/c/learn/courses/agentic-coding/learning/intermediate#worked-example-40-a-three-round-correction-loop-converging)

### Advanced (Examples 41-54)

- [Example 41: Escalate a Security-Critical Change](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-41-escalate-a-security-critical-change)
- [Example 42: When Not to Delegate a Novel Algorithm](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-42-when-not-to-delegate-a-novel-algorithm)
- [Example 43: Unverifiable-Output Refusal](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-43-unverifiable-output-refusal)
- [Example 44: Human Decision Gate Mid-Session](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-44-human-decision-gate-mid-session)
- [Example 45: Context-Managed Feature Loop](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-45-context-managed-feature-loop)
- [Example 46: Mechanical Refactor Across Files](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-46-mechanical-refactor-across-files)
- [Example 47: Reject a Confidently Wrong Refactor](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-47-reject-a-confidently-wrong-refactor)
- [Example 48: Trust-Verify Decision Log](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-48-trust-verify-decision-log)
- [Example 49: MCP + Subagent Research Task](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-49-mcp--subagent-research-task)
- [Example 50: Prompt-Injection Guardrail Config](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-50-prompt-injection-guardrail-config)
- [Example 51: Spec-Driven TDD Agent Session](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-51-spec-driven-tdd-agent-session)
- [Example 52: Full Verify-First Feature Session](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-52-full-verify-first-feature-session)
- [Example 53: Cost-Bounded Iterative Refinement](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-53-cost-bounded-iterative-refinement)
- [Example 54: Post-Mortem a Bad Agent Merge](/en/c/learn/courses/agentic-coding/learning/advanced#worked-example-54-post-mortem-a-bad-agent-merge)

---

← Previous: [Software Engineering Practices
Drilling](../../software-engineering-practices/drilling/overview.md) &middot; Next: [Beginner
Examples](./beginner.md) →
