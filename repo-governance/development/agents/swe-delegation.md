---
description: >-
  Requires a session doing coding work to dispatch the fitting swe agent rather than doing the work in the main thread,
  defines coding work, and names the three exceptions.
when_to_use: >-
  Use before implementing, debugging, reviewing, or testing code in a session, or when deciding whether a change is
  small enough to make directly.
---

# SWE Delegation

When a session implements, debugs, reviews, or tests code, it dispatches the fitting `swe-*` agent the repository holds
rather than doing the work in the main thread.

## Coding Work

Coding work is testable code: applications, libraries, scripts, tests, and shell or other script code that carries
behaviour. Documents, rules, plans, and declarative configuration, such as JSON or YAML settings, are not coding work;
their own families handle them.

## Which Agent

| The work                                                      | Agent                  |
| ------------------------------------------------------------- | ---------------------- |
| a goal spanning several coding tasks or agents                | `swe-orchestrator`     |
| a module boundary, a new dependency, or a tradeoff to decide  | `swe-architect`        |
| new or changed behaviour, or findings to apply                | `swe-developer`        |
| a failing type check, lint run, or test                       | `swe-debugger`         |
| a static review of changed code against the adopted standards | `swe-reviewer`         |
| judging a running web interface                               | `swe-web-tester`       |
| judging first use of a web interface or a command-line tool   | `swe-usability-tester` |
| judging a running request-based interface                     | `swe-api-tester`       |
| judging infrastructure as applied                             | `swe-infra-tester`     |
| cutting or deploying a release, or repinning a pinned tool    | `swe-releaser`         |

Each agent's definition, in the repository's agent index, states its modes and hand-offs.

## Exceptions

The main thread may do coding work itself only:

1. **A trivial edit,** such as a typo or one changed value.
2. **A harness with no subagent support,** where no agent can be dispatched.
3. **A tool repin** of a pinned upstream tool, such as HIPPO, RHINO, or FERRET, in a repository that holds no
   `swe-releaser`.

A session that uses the trivial-edit or harness exception says so in its report, with the reason. The repin exception
needs no reason, because this convention names it.

## Why

Execution-tier agents run on the cheaper model the repository maps to that tier, and the files they read stay out of the
main session's context, which keeps the reasoning that follows clear, as
[Agent Workflow Orchestration](agent-workflow-orchestration.md) explains.

## Enforcement

Unenforced by decision: whether a session delegated is visible only in its transcript, which no repository check reads.
Review and the session's own report carry it.
