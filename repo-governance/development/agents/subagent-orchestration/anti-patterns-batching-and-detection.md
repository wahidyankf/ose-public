---
description: "Covers launching a full batch without waiting, relying solely on task-notifications for stuck detection, reading the transcript file to check progress, self-promoting the concurrency cap, and handing concurrent agents the same working filename."
when_to_use: Use when reviewing an orchestrator's batching or stuck-detection behaviour for a common mistake.
---

# Anti-Patterns — Batching and Stuck-Detection Mistakes

## Launching a Full Batch Without Waiting

**Problem**: The main agent launches all subagents simultaneously to minimize total elapsed time.

**Why it fails**: More than N concurrent background agents (N+1 total including the main thread) saturates the per-minute API quota and increases token burn rate. Rate-limit errors cascade; agents that would have succeeded fast must retry, extending total batch time beyond the sequential baseline. On a shared machine the same overshoot also starves the other agents and engineers working against the same disk and runners.

**Fix**: Hold background agents at the declared N (N+1 total including the main thread; N defaults to 3). Launch the next agent only after one completes.

## Relying Solely on Task-Notifications for Stuck Detection

**Problem**: The main agent waits for task-notification completion signals and takes no other action.

**Why it fails**: A stuck agent may never emit a completion notification. The batch blocks indefinitely.

**Fix**: Poll file mtime every 3 minutes. Apply the 30-minute stuck threshold. Call `TaskStop` when triggered.

## Reading the Transcript File to Check Progress

**Problem**: The main agent reads the `/private/tmp/...output` transcript file via shell to diagnose a slow agent.

**Why it fails**: The transcript file is large and grows with every tool call. Reading it overflows the main agent's context window, degrading reasoning quality for all subsequent work in the session.

**Fix**: Poll the output file mtime only. If content verification is needed post-completion, read only the relevant sections of the output file.

## Self-Promoting the Concurrency Cap

**Problem**: The main agent raises the cap to 3 or 4 background agents on its own judgment because early agents are completing quickly.

**Why it fails**: Completion speed varies. A batch that starts fast can become rate-limited as all agents hit their tool-intensive middle sections simultaneously. The default N is set deliberately at 3 background agents (N+1 total including the main thread) — balancing parallel throughput against API headroom and token/compute-budget burn — to stay safely below the saturation threshold at all batch phases.

**Fix**: Hold at the declared N background agents (N+1 total including the main thread; N defaults to 3). N is adjusted deliberately — per-plan or along the way — never self-promoted by the main agent mid-batch.

## Handing Concurrent Agents the Same Working Filename

**Problem**: Several agents in one fan-out each write an intermediate artefact — a review body, a
findings file, a JSON result — to the same generic path in the shared session scratchpad
(`review-body.md`, `out.json`, `tmp.txt`).

**Why it fails**: The scratchpad is isolated from other _sessions_, not from your own fan-out. Two
agents running at once share it as mutable global state, and one can overwrite the other between
its own write and its own read. The corruption is silent: each agent's write succeeds, each read
succeeds, and the artefact that ships belongs to a different agent. When the artefact is a merge
precondition — a leak review verdict carrying a head SHA — that is evidence for a commit nobody reviewed.

**Fix**: Give every concurrently-running agent a task-unique path, and require any agent that
posts to an external system to verify by reading the posted object back, not by the call's exit
status.
