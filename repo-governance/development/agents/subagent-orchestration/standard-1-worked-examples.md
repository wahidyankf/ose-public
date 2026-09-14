---
description: "Continues Standard 1 with worked examples of the default-concurrency cap."
when_to_use: Use when you need a worked example of applying the default concurrency cap.
---

# Standard 1 — Default Concurrency (Continued)

**Rationale**: Each subagent operates its own independent tool-call stream against the model vendor's API. Running more background subagents than the machine and budget can absorb risks saturating the per-minute request quota and increases token burn rate, producing rate-limit errors that cascade and slow the entire batch — this is a token-starvation and rate-limit concern, not merely a throughput cap. N=3 is chosen to **bound token/compute-budget burn** while still delivering meaningful parallel throughput. Assume the machine is **shared**: other agents, engineers, and processes are running concurrently against the same disk, git object store, and CI runners, so the safe N is bounded by what that shared machine can absorb alongside them. This is the concrete subagent specialization of the broader parallel-by-default working norm — see [Parallel-by-Default Practice](../../practice/parallel-by-default.md) for the general principle.

**Sequencing rule**: Launch a new subagent only after a prior one completes (via task-notification message) or after calling `TaskStop` on a stuck agent. Do not pre-queue more than N pending background launches at once.

**Adjustment rule**: N is adjustable per-plan and along the way — raised when independent work, machine capacity, and budget headroom all allow, and **lowered when required** under budget, runner, or disk pressure. A plan declares its chosen N in its `## Parallelization Model` section. The main agent MUST NOT silently self-promote beyond the declared N based on its own assessment of available headroom.

## Examples

```
PASS: N-1 background agents active, another independent unit is ready → launch it (keep slots full)
PASS: N background agents active → wait for one to complete → launch next
PASS: Plan declares N=5 for a wide independent batch → 5 background agents active for that plan
PASS: Disk pressure on the shared machine → lower N for the rest of the batch
PASS: Two dependent nodes remain → run them serially even though slots are free (DAG governs)
FAIL: More than the declared N launched simultaneously
FAIL: Main agent raises N on its own because "the first few seem fast"
FAIL: Splitting one dependent chain into fake parallel units to fill idle slots
```
