---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

Claude Code is Anthropic's terminal coding agent: it reads your repository, edits files, runs commands, and iterates with you in plain language. This course teaches it as a working tool rather than a product tour, from the first version check to fair comparisons against other agents, always with permissions scoped and diffs reviewed.

## Why this exists -- the big idea

**The problem before the solution**: learners either skip terminal coding agents entirely or copy prompts blindly, with no method for configuring permissions, reading the trace, or catching a wrong step before it ships. **Keep this if you forget everything else**: treat the agent's output as a draft from a fast junior, not as a fact; verify everything it claims before you act on it.

## What you will be able to do

After this course you can configure Claude Code for a real repository including its settings layers and permission model, write task briefs that state the done condition and the files the agent may touch, read the agent's trace and tell a correct step from a plausible-looking wrong one, recover from stuck or looping sessions without losing committed work, and compare Claude Code against another agent tool on a shared, repeatable task.

## How this course is organized

[Learning](/en/learn/courses/claude-code-for-engineers/learning/overview) holds 78 worked examples in three levels: Beginner (Examples 1-25) installs the tool, starts sessions, reads output, and scopes permissions; Intermediate (Examples 26-53) writes briefs, lands multi-file changes behind tests, and counts cost; Advanced (Examples 54-78) recovers stuck sessions, configures deeply, and compares agents fairly. The [capstone](/en/learn/courses/claude-code-for-engineers/learning/capstone/overview) runs one realistic multi-step task end to end with its full trace, and [drilling](/en/learn/courses/claude-code-for-engineers/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: agentic-coding for the draft-and-verify discipline, version-control-and-git for the diffs and checkpoints every session relies on, and just-enough-bash because every example starts from a shell invocation. Assumed knowledge: comfort with a terminal, Git, and reading a diff.

## About the examples

Every runnable example drives a deterministic fixture shim of the Claude Code CLI verified against release 2.1.304 on 2026-10-20: no real network call, no real account, and no billing. The shim models the documented command surface and states its simplifications plainly; confirm current behaviour with `claude --help` on your own install.

## References

- Claude Code overview (surfaces, install routes, account requirement). Accessed 2026-10-20. [Claude Code overview](https://code.claude.com/docs/en/overview)
- Claude Code changelog, generated from the GitHub CHANGELOG.md (release 2.1.304 dated 2026-10-19, the version this course verified). Accessed 2026-10-20. [Claude Code changelog](https://code.claude.com/docs/en/changelog)
- CLI reference (`claude`, `claude -p`, pipes, `claude -c`, `claude -r`, `claude update`, `claude install`, `claude auth`). Accessed 2026-10-20. [CLI reference](https://code.claude.com/docs/en/cli-reference)
- Settings files and precedence (managed, command line, project local, shared project, user). Accessed 2026-10-20. [Settings](https://code.claude.com/docs/en/settings)
- Configure permissions (tiers, manual and auto modes, remembered rules in `.claude/settings.local.json`). Accessed 2026-10-20. [Permissions](https://code.claude.com/docs/en/permissions)
- How Claude remembers your project (`CLAUDE.md`, `AGENTS.md`, auto memory). Accessed 2026-10-20. [Project memory](https://code.claude.com/docs/en/memory)
- Manage sessions (`--continue`, `--resume`, transcripts). Accessed 2026-10-20. [Sessions](https://code.claude.com/docs/en/sessions)
- Extend Claude Code (skills, subagents, hooks, MCP, plugins). Accessed 2026-10-20. [Extending](https://code.claude.com/docs/en/features-overview)

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Check the Installed Version](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-1-check-the-installed-version)
- [Example 2: Install Without Surprises](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-2-install-without-surprises)
- [Example 3: Start Your First Session](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-3-start-your-first-session)
- [Example 4: Print Mode for One Shot Answers](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-4-print-mode-for-one-shot-answers)
- [Example 5: Pipe Context Into a Query](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-5-pipe-context-into-a-query)
- [Example 6: Continue the Last Conversation](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-6-continue-the-last-conversation)
- [Example 7: Resume a Named Session](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-7-resume-a-named-session)
- [Example 8: Write Your First Task Brief](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-8-write-your-first-task-brief)
- [Example 9: Tell a Plan From an Action](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-9-tell-a-plan-from-an-action)
- [Example 10: Read a Tool Use Trace](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-10-read-a-tool-use-trace)
- [Example 11: Spot the Reads Before Writes](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-11-spot-the-reads-before-writes)
- [Example 12: The Diff Is the Deliverable](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-12-the-diff-is-the-deliverable)
- [Example 13: Approve or Reject a Diff](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-13-approve-or-reject-a-diff)
- [Example 14: When the Agent Shows Its Work](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-14-when-the-agent-shows-its-work)
- [Example 15: Ask for a Plan First](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-15-ask-for-a-plan-first)
- [Example 16: Compare Two Candidate Diffs](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-16-compare-two-candidate-diffs)
- [Example 17: Keep the Human in the Loop](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-17-keep-the-human-in-the-loop)
- [Example 18: The Three Permission Answers](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-18-the-three-permission-answers)
- [Example 19: Read Only Stays Silent](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-19-read-only-stays-silent)
- [Example 20: Bash Asks First](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-20-bash-asks-first)
- [Example 21: Remembered Approvals Are Permanent](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-21-remembered-approvals-are-permanent)
- [Example 22: Manual Mode Versus Auto Mode](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-22-manual-mode-versus-auto-mode)
- [Example 23: The Sandbox Boundary](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-23-the-sandbox-boundary)
- [Example 24: A Deny Rule Beats an Allow Rule](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-24-a-deny-rule-beats-an-allow-rule)
- [Example 25: Your First Scoped Session](/en/learn/courses/claude-code-for-engineers/learning/beginner#example-25-your-first-scoped-session)

### Intermediate (Examples 26–53)

- [Example 26: State the Done Condition](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-26-state-the-done-condition)
- [Example 27: Scope the Files It May Touch](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-27-scope-the-files-it-may-touch)
- [Example 28: Name the Guardrails Up Front](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-28-name-the-guardrails-up-front)
- [Example 29: Vague Prompt Versus Scoped Brief](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-29-vague-prompt-versus-scoped-brief)
- [Example 30: Set a Goal the Agent Can Test](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-30-set-a-goal-the-agent-can-test)
- [Example 31: Feed the Error Back Verbatim](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-31-feed-the-error-back-verbatim)
- [Example 32: One Task Per Turn](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-32-one-task-per-turn)
- [Example 33: Budget Turns Before You Start](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-33-budget-turns-before-you-start)
- [Example 34: Write the Brief Down First](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-34-write-the-brief-down-first)
- [Example 35: Change Three Files Coherently](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-35-change-three-files-coherently)
- [Example 36: Review Every Hunk](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-36-review-every-hunk)
- [Example 37: Reject One Hunk Keep the Rest](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-37-reject-one-hunk-keep-the-rest)
- [Example 38: Demand the Test Gate](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-38-demand-the-test-gate)
- [Example 39: Red Green Then Accept](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-39-red-green-then-accept)
- [Example 40: Trace a Rename Across Files](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-40-trace-a-rename-across-files)
- [Example 41: A Test the Agent Wrote Itself](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-41-a-test-the-agent-wrote-itself)
- [Example 42: When Tests Disagree With the Diff](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-42-when-tests-disagree-with-the-diff)
- [Example 43: Small Commits After Every Win](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-43-small-commits-after-every-win)
- [Example 44: The Whole Change in One Diff Stat](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-44-the-whole-change-in-one-diff-stat)
- [Example 45: Where Transcripts Live](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-45-where-transcripts-live)
- [Example 46: Reconstruct a Session From Its Log](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-46-reconstruct-a-session-from-its-log)
- [Example 47: Count Turns Per Task](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-47-count-turns-per-task)
- [Example 48: Estimate Token Cost Before Lunch](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-48-estimate-token-cost-before-lunch)
- [Example 49: Cache Hits Are Free Turns](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-49-cache-hits-are-free-turns)
- [Example 50: Compact Without Losing the Plot](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-50-compact-without-losing-the-plot)
- [Example 51: The Context Window Budget](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-51-the-context-window-budget)
- [Example 52: Export the Transcript](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-52-export-the-transcript)
- [Example 53: Cost Bounded Refinement Loop](/en/learn/courses/claude-code-for-engineers/learning/intermediate#example-53-cost-bounded-refinement-loop)

### Advanced (Examples 54–78)

- [Example 54: The Loop That Repeats Itself](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-54-the-loop-that-repeats-itself)
- [Example 55: Interrupt Without Losing Work](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-55-interrupt-without-losing-work)
- [Example 56: Correct the Wrong Assumption](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-56-correct-the-wrong-assumption)
- [Example 57: Restart From the Last Green State](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-57-restart-from-the-last-green-state)
- [Example 58: Refuse the Unsafe Action](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-58-refuse-the-unsafe-action)
- [Example 59: When the Agent Edits the Wrong File](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-59-when-the-agent-edits-the-wrong-file)
- [Example 60: Diagnose a Stuck Session From Its Trace](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-60-diagnose-a-stuck-session-from-its-trace)
- [Example 61: The Post Mortem Habit](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-61-the-post-mortem-habit)
- [Example 62: Your Project Memory File](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-62-your-project-memory-file)
- [Example 63: Settings Layers and Precedence](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-63-settings-layers-and-precedence)
- [Example 64: A Hook That Formats on Edit](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-64-a-hook-that-formats-on-edit)
- [Example 65: A Skill the Agent Can Reuse](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-65-a-skill-the-agent-can-reuse)
- [Example 66: An MCP Tool Behind One Config](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-66-an-mcp-tool-behind-one-config)
- [Example 67: A Slash Command for Your Workflow](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-67-a-slash-command-for-your-workflow)
- [Example 68: A Subagent for Bounded Work](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-68-a-subagent-for-bounded-work)
- [Example 69: Managed Settings as a Ceiling](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-69-managed-settings-as-a-ceiling)
- [Example 70: Debug Why Config Did Not Apply](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-70-debug-why-config-did-not-apply)
- [Example 71: Define the Shared Task](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-71-define-the-shared-task)
- [Example 72: Fix the Scoring Rubric First](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-72-fix-the-scoring-rubric-first)
- [Example 73: Run the Same Brief Twice](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-73-run-the-same-brief-twice)
- [Example 74: Time Turns Tokens and Diffs](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-74-time-turns-tokens-and-diffs)
- [Example 75: Judge Correctness Before Style](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-75-judge-correctness-before-style)
- [Example 76: The Repeatability Check](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-76-the-repeatability-check)
- [Example 77: Score the Safety Behaviour](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-77-score-the-safety-behaviour)
- [Example 78: Publish the Verdict and Its Limits](/en/learn/courses/claude-code-for-engineers/learning/advanced#example-78-publish-the-verdict-and-its-limits)
