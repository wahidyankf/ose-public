---
title: "Rewrite DDD + Hexagonal in Practice with hypothetical domain"
status: done
created: 2026-05-17
completed: 2026-05-17
owner: tigalakilaki12
---

# Rewrite DDD + Hexagonal in Practice with hypothetical domain

## Problem

The `apps/ayokoding-web/content/en/learn/software-engineering/software-architecture/ddd-hexagonal-in-practice/` tutorial (two tracks, ~10k lines, 27 guides per track) was grounded against two real codebases — `apps/ose-app-be` (F#/Giraffe/Npgsql) and `apps/organiclever-be` (Java/Spring Boot 4) — via a mirror-mode / intended-layout / illustrative-mode dogfooding contract. The real codebases drift; every drift made the tutorial wrong. The tutorial then taught "how the pieces connect in production", which is exactly the kind of content that ages worst when wired to a moving codebase.

## Outcome

Both tracks rewritten in full against a single hypothetical domain — **Conference Talk Submission Platform** — with four bounded contexts (`submission`, `review`, `scheduling`, `ai-assist`). Same domain across FP and OOP tracks so the reader can compare F# vs Java wiring of the identical problem.

| Metric                                                           | Before          | After                    |
| ---------------------------------------------------------------- | --------------- | ------------------------ |
| Real-codebase references (`ose-app-be`, `organiclever-be`)       | dozens per file | 0 across all 13 files    |
| Dogfooding callouts (`> Source:`, intended layout, illustrative) | scattered       | 0                        |
| FP guide count                                                   | 27              | 27                       |
| OOP guide count                                                  | 27              | 27                       |
| FP total lines                                                   | 4089            | 3945                     |
| OOP total lines                                                  | 5757            | 5243                     |
| Static pages built                                               | 1179            | 1179                     |
| Link validation                                                  | 0 broken        | 0 broken (3831 links)    |
| Unit coverage                                                    | 86.63%          | 86.63% (≥ 82% threshold) |

## Lessons

1. **Sub-agent parallelism worked well for big content rewrites.** Two `apps-ayokoding-web-in-the-field-maker` sub-agents ran in parallel (FP track + OOP track) with a fully locked domain spec passed inline. The shared spec kept vocabulary consistent across both tracks even without cross-agent communication.
2. **Worktree path confusion**: this work started in a Claude Code worktree at `~/ose-projects/ose-public/worktrees/abundant-mapping-widget/`, but all content edits used absolute paths into the primary checkout. The plan files lived only in the worktree until manually copied to the primary checkout for archive. Lesson: when editing across both worktree and primary, be explicit about which checkout owns which files.
3. **Self-validation by the maker subagent saved a checker round-trip.** The maker re-grepped the forbidden-strings list before returning, which let the parent skip a standalone in-the-field-checker run for this content-only rewrite.
4. **Dropping the dogfooding contract simplified the entire tutorial.** "Mirror mode / intended-layout mode / illustrative mode" was a creative attempt at dogfooding integrity but added three concept categories the reader had to track. Single hypothetical mode reads much cleaner.
5. **Same domain across both tracks pays off.** Reader can now diff a Guide 5 port definition in F# against the Guide 5 port definition in Java and see exactly what changes — that comparison was much harder when each track had its own codebase.

## Document index

- [brd.md](./brd.md) — why-rework rationale
- [prd.md](./prd.md) — Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — locked hypothetical domain spec + per-guide catalog
- [delivery.md](./delivery.md) — TDD-shaped delivery checklist

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
