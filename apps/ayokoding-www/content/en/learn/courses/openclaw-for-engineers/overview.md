---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

Treat the agent's output as a draft from a fast junior, not as a fact. That single sentence is this course in miniature: OpenClaw is a self-hosted terminal coding agent you drive from the shell, and everything it claims — files touched, tests passed, sessions remembered — earns trust only after you verify it.

This course teaches OpenClaw the way an engineer actually drives it. You will configure it for a real repository, write task briefs that state the done condition and the files it may touch, read its traces well enough to tell a correct step from a plausible-looking wrong one, recover stuck sessions without losing finished work, and compare OpenClaw against a sibling agent on one shared, repeatable task.

The course has 78 runnable examples in three tiers. [Beginner](./learning/beginner.md) covers installation checks, onboarding paths, the config file, first tasks, gateway status, message round-trips, workspace scoping, reading traces and diffs, plan-then-act, sessions, memory, argument inspection, health signals, logs, allow and deny lists, approvals, sandboxes, exec policy, channel groups, secret redaction, dry runs, and audit entries. [Intermediate](./learning/intermediate.md) covers task-brief discipline, multi-file change review, subagent delegation, session overrides, worktree isolation, review loops, atomic apply, rollback, channel-scoped change, change summaries, trace timelines, token accounting, turn budgets, cost guardrails, log levels, audit export, failure signatures, latency splits, and cost reports. [Advanced](./learning/advanced.md) covers stuck-loop detection, safe interrupts, resumes, assumption repair, vetoes, clean resets, triage, post-mortems, skill authoring, plugin manifests, channel wiring, custom tools, failover tuning, multi-environment configs, backup and migration, safe updates, health monitoring, and a full comparison protocol across eight closing examples.

Start with the [learning overview](./learning/overview.md), work the tiers in order, finish with the [capstone](./learning/capstone/overview.md), and use [drilling](./drilling/overview.md) for recall, applied problems, katas, and self-checks. Every example runs a deterministic fixture shim of the OpenClaw CLI — no live network, no API key, no account — so each one executes exactly as printed, today and in two years.
