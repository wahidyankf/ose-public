---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior courses**: `agentic-coding`, `version-control-and-git`, `just-enough-bash`. You should be comfortable in a terminal, with Git, and reading a diff.
- **Tools and environment**: a macOS or Linux terminal and **Python 3.14** (`python3 --version`). Every example is a self-contained standard-library script; run it with `python3 main.py` from inside its own directory.
- **Assumed knowledge**: basic terminal use. No prior OpenClaw experience is needed — this course starts from the install check.

## The fixture shim

Every runnable example drives a deterministic fixture shim of the OpenClaw command line and its file-system effects, not the live product: no real network call, no real API key, and no real account. The shim replays fixed outputs shaped like the real CLI so each lesson stays runnable long after releases move on. Where the shim simplifies the live tool — fixed traces, no latency, no authentication — the lesson says so, and no shim behaviour should be read as a guarantee about the live product. Version-specific claims about the live tool cite the vendor documentation below, verified on the day this course was written.

## How to run the examples

Each example lives in `learning/code/ex-NN-<slug>/` with a `run.yaml` harness spec. The lesson shows the complete file plus its recorded output; copy the directory, run `python3 main.py`, and compare your output byte for byte. The [course map](#examples-by-level) is the Examples by Level section at the end of this page: one bullet per example, deep-linked to its heading.

## Version note

This course was written against the OpenClaw release line documented in References: version **v2026.10.5**, verified 2026-10-20. The vendor ships often; when your installed CLI disagrees with a lesson, trust your installed CLI and check the current docs linked below.

## Examples by Level

Every example in this course, deep-linked to its heading. Use this map to jump between levels or to revisit one example.

### Beginner (Examples 1–25)

- [Example 1: Checking the Install](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-1-checking-the-install)
- [Example 2: Choosing an Onboarding Path](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-2-choosing-an-onboarding-path)
- [Example 3: Reading the Config File](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-3-reading-the-config-file)
- [Example 4: Configuring a Model Provider](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-4-configuring-a-model-provider)
- [Example 5: Running a First Task](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-5-running-a-first-task)
- [Example 6: Reading Gateway Status](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-6-reading-gateway-status)
- [Example 7: Sending a Message Round-Trip](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-7-sending-a-message-round-trip)
- [Example 8: Scoping a Workspace](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-8-scoping-a-workspace)
- [Example 9: Reading a Tool-Use Trace](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-9-reading-a-tool-use-trace)
- [Example 10: Spotting a Plausible Wrong Step](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-10-spotting-a-plausible-wrong-step)
- [Example 11: Reviewing a Proposed Diff](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-11-reviewing-a-proposed-diff)
- [Example 12: Asking for a Plan First](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-12-asking-for-a-plan-first)
- [Example 13: Reading a Session Transcript](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-13-reading-a-session-transcript)
- [Example 14: Checking What the Agent Remembers](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-14-checking-what-the-agent-remembers)
- [Example 15: Inspecting Tool-Call Arguments](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-15-inspecting-tool-call-arguments)
- [Example 16: Reading Exit Codes and Health](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-16-reading-exit-codes-and-health)
- [Example 17: Tailing the Gateway Log](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-17-tailing-the-gateway-log)
- [Example 18: Allowing and Denying Tools](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-18-allowing-and-denying-tools)
- [Example 19: Requiring Approval Mid-Task](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-19-requiring-approval-mid-task)
- [Example 20: Choosing a Sandbox Mode](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-20-choosing-a-sandbox-mode)
- [Example 21: Scoping Shell Execution](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-21-scoping-shell-execution)
- [Example 22: Gating Channels by Access Group](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-22-gating-channels-by-access-group)
- [Example 23: Redacting Secrets from Output](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-23-redacting-secrets-from-output)
- [Example 24: Previewing with a Dry Run](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-24-previewing-with-a-dry-run)
- [Example 25: Writing an Audit Trail Entry](/en/learn/courses/openclaw-for-engineers/learning/beginner#example-25-writing-an-audit-trail-entry)

### Intermediate (Examples 26–53)

- [Example 26: Anatomy of a Task Brief](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-26-anatomy-of-a-task-brief)
- [Example 27: Writing a Done Condition](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-27-writing-a-done-condition)
- [Example 28: Setting Scope and Guardrails](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-28-setting-scope-and-guardrails)
- [Example 29: Rewriting a Vague Brief](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-29-rewriting-a-vague-brief)
- [Example 30: Briefing Plan-Then-Act Work](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-30-briefing-plan-then-act-work)
- [Example 31: Packing Session Context](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-31-packing-session-context)
- [Example 32: Briefing a Skill Invocation](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-32-briefing-a-skill-invocation)
- [Example 33: Briefing a Scheduled Task](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-33-briefing-a-scheduled-task)
- [Example 34: Reviewing a Brief Before Sending](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-34-reviewing-a-brief-before-sending)
- [Example 35: Reviewing a Multi-File Diff](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-35-reviewing-a-multi-file-diff)
- [Example 36: Making the Agent Prove Its Change](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-36-making-the-agent-prove-its-change)
- [Example 37: Delegating to a Subagent](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-37-delegating-to-a-subagent)
- [Example 38: Overriding Tools per Session](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-38-overriding-tools-per-session)
- [Example 39: Isolating Work in a Worktree](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-39-isolating-work-in-a-worktree)
- [Example 40: Looping Review Until Clean](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-40-looping-review-until-clean)
- [Example 41: Rejecting a Partial Apply](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-41-rejecting-a-partial-apply)
- [Example 42: Rolling Back from Backup](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-42-rolling-back-from-backup)
- [Example 43: Changing Through One Channel](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-43-changing-through-one-channel)
- [Example 44: Summarising a Change for Review](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-44-summarising-a-change-for-review)
- [Example 45: Building a Trace Timeline](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-45-building-a-trace-timeline)
- [Example 46: Accounting Tokens per Turn](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-46-accounting-tokens-per-turn)
- [Example 47: Enforcing a Turn Budget](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-47-enforcing-a-turn-budget)
- [Example 48: Tripping a Cost Guardrail](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-48-tripping-a-cost-guardrail)
- [Example 49: Using Log Levels Well](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-49-using-log-levels-well)
- [Example 50: Exporting the Audit Log](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-50-exporting-the-audit-log)
- [Example 51: Grepping a Failure Signature](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-51-grepping-a-failure-signature)
- [Example 52: Breaking Down Session Latency](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-52-breaking-down-session-latency)
- [Example 53: Writing a Weekly Cost Report](/en/learn/courses/openclaw-for-engineers/learning/intermediate#example-53-writing-a-weekly-cost-report)

### Advanced (Examples 54–78)

- [Example 54: Detecting a Stuck Loop](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-54-detecting-a-stuck-loop)
- [Example 55: Interrupting Without Losing Work](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-55-interrupting-without-losing-work)
- [Example 56: Resuming After an Interrupt](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-56-resuming-after-an-interrupt)
- [Example 57: Correcting a Wrong Assumption](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-57-correcting-a-wrong-assumption)
- [Example 58: Vetoing an Unsafe Action](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-58-vetoing-an-unsafe-action)
- [Example 59: Resetting a Session Cleanly](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-59-resetting-a-session-cleanly)
- [Example 60: Triaging a Failed Session](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-60-triaging-a-failed-session)
- [Example 61: Writing a Session Post-Mortem](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-61-writing-a-session-post-mortem)
- [Example 62: Authoring a Skill](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-62-authoring-a-skill)
- [Example 63: Reading a Plugin Manifest](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-63-reading-a-plugin-manifest)
- [Example 64: Configuring a Channel Plugin](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-64-configuring-a-channel-plugin)
- [Example 65: Registering a Custom Tool](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-65-registering-a-custom-tool)
- [Example 66: Tuning Model Failover](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-66-tuning-model-failover)
- [Example 67: Managing Multiple Environments](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-67-managing-multiple-environments)
- [Example 68: Backing Up and Migrating](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-68-backing-up-and-migrating)
- [Example 69: Updating OpenClaw Safely](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-69-updating-openclaw-safely)
- [Example 70: Monitoring Gateway Health](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-70-monitoring-gateway-health)
- [Example 71: Setting Comparison Criteria](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-71-setting-comparison-criteria)
- [Example 72: Defining the Shared Task](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-72-defining-the-shared-task)
- [Example 73: Running the OpenClaw Leg](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-73-running-the-openclaw-leg)
- [Example 74: Running the Sibling Leg](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-74-running-the-sibling-leg)
- [Example 75: Scoring Both Traces](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-75-scoring-both-traces)
- [Example 76: Comparing Cost Honestly](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-76-comparing-cost-honestly)
- [Example 77: Writing the Verdict with Caveats](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-77-writing-the-verdict-with-caveats)
- [Example 78: Re-Running the Comparison](/en/learn/courses/openclaw-for-engineers/learning/advanced#example-78-re-running-the-comparison)

## References

- OpenClaw documentation, release v2026.10.5 — https://docs.openclaw.ai/ — Accessed 2026-10-20.
- OpenClaw release notes — https://docs.openclaw.ai/releases — Accessed 2026-10-20.
- OpenClaw command-line reference — https://docs.openclaw.ai/cli — Accessed 2026-10-20.
- OpenClaw product site — https://openclaw.ai — Accessed 2026-10-20.
- OpenClaw source repository — https://github.com/openclaw/openclaw — Accessed 2026-10-20.
