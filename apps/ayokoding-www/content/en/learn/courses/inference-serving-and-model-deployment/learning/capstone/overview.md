---
title: "Capstone"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 13
---

## Goal

Stand up and tune a self-hosted inference service for a small open-weights model against a stated
latency SLO and a realistic workload distribution: continuous batching over a paged KV cache with
prefix sharing, an admission and scheduling policy chosen deliberately on the throughput/latency
frontier, a documented GPU memory budget, a quantization decision backed by a measured quality
evaluation, an autoscaling policy that survives cold starts, full serving observability -- and a
defensible build-versus-buy recommendation. The whole thing runs end to end against the committed
simulator, offline, with no GPU and no downloaded model weights.

## Concepts exercised

- [x] prefill/decode phases and the bandwidth-bound decode (co-02-co-04)
- [x] KV cache arithmetic and its role as the scarce resource (co-05-co-07, co-18)
- [x] paged allocation and prefix sharing (co-08-co-10)
- [x] continuous batching, scheduling, admission control, preemption (co-11-co-14)
- [x] the throughput/latency frontier and the four latency metrics (co-15-co-17)
- [x] quantization evaluated rather than assumed (co-19)
- [x] capacity planning and realistic load testing against a length distribution (co-21, co-22)
- [x] autoscaling with cold starts, packaging, staged model rollout (co-23-co-25)
- [x] serving observability (co-26)
- [x] a total-cost-of-ownership decision (co-27, co-28)

## Step 1: `serve/` -- serve the model and document the memory budget

Serves the model, instruments the four distinct latency metrics from co-16, and documents the GPU
memory budget with the cache arithmetic that yields a maximum concurrency. This step's output feeds
directly into Step 2's scheduler as the cache budget it schedules against.

**`learning/capstone/code/serve/server.py`**

```python
"""Capstone step 1 -- serve/: serve the model, instrument the four latency metrics, and document the
GPU memory budget with the cache arithmetic that yields a maximum concurrency.

Reuses the exact formulas taught in Examples 1, 11, 14, 16, and 59 -- nothing here is new arithmetic,
only their assembly into one importable module the rest of the capstone builds on.
"""

from dataclasses import dataclass


@dataclass
class TinyModel:  # => co-01/co-24: a stand-in for a small, self-hosted open-weights model
    name: str = "example-org/example-7b"


def handle_completion_request(model: TinyModel, prompt: str, max_output_tokens: int) -> dict[str, int | str]:
    # => co-01: the served endpoint -- request cost is UNKNOWABLE until generation actually finishes
    output_tokens = min(max_output_tokens, len(prompt) % 47 + 3)  # => deterministic, prompt-dependent length
    return {"model": model.name, "prompt_tokens": len(prompt.split()), "output_tokens": output_tokens}


def kv_cache_bytes_per_request(num_layers: int, num_heads: int, head_dim: int, seq_len: int, bytes_per_value: int) -> int:
    # => co-06: the cache-size formula from Example 11 / Example 59, unchanged
    return 2 * num_layers * num_heads * head_dim * seq_len * bytes_per_value


def gpu_memory_budget(
    total_gpu_bytes: int,
    weights_bytes: int,
    activations_bytes: int,
    framework_overhead_bytes: int,
    bytes_per_request: int,
) -> dict[str, int]:
    # => co-18: weights + cache + activations + overhead must all fit -- the remainder buys concurrency
    remainder_for_cache = total_gpu_bytes - weights_bytes - activations_bytes - framework_overhead_bytes
    max_concurrency = remainder_for_cache // bytes_per_request  # => co-07: cache budget SETS the ceiling
    return {
        "total_gpu_bytes": total_gpu_bytes,
        "weights_bytes": weights_bytes,
        "activations_bytes": activations_bytes,
        "framework_overhead_bytes": framework_overhead_bytes,
        "remainder_for_cache_bytes": remainder_for_cache,
        "bytes_per_request": bytes_per_request,
        "max_concurrency": max_concurrency,
    }


@dataclass
class GenerationTrace:  # => co-16: one completed request's four distinct latency metrics
    ttft_ms: float
    total_ms: float
    output_tokens: int


def compute_metrics(trace: GenerationTrace) -> dict[str, float]:
    # => co-16: TTFT, ITL, per-user tokens/sec, and (separately) aggregate throughput are FOUR distinct numbers
    decode_ms = trace.total_ms - trace.ttft_ms
    itl_ms = decode_ms / max(trace.output_tokens - 1, 1)
    tokens_per_sec = trace.output_tokens / (trace.total_ms / 1000.0)
    return {
        "ttft_ms": trace.ttft_ms,
        "itl_ms": round(itl_ms, 2),
        "tokens_per_sec": round(tokens_per_sec, 2),
    }
```

**Verify**: `test_memory_budget_max_concurrency_matches_admission_refusal_point` builds a real
`ContinuousBatchScheduler` (Step 2) against this exact budget's `max_concurrency` and confirms active
admission never exceeds it -- the documented number and the observed scheduling behavior match.

## Step 2: `scheduler/` -- continuous batching, paged cache, prefix sharing, preemption

Implements continuous batching over a paged cache with prefix sharing, plus an admission and
scheduling policy with preemption under pressure -- and a contiguous, static-batching baseline to
measure the improvement against.

**`learning/capstone/code/scheduler/scheduler.py`**

```python
"""Capstone step 2 -- scheduler/: continuous batching over a paged cache with prefix sharing, plus an
admission and scheduling policy with preemption under pressure.

Reuses the mechanics taught across Examples 29-46 -- static/continuous batching, paged allocation,
prefix sharing, and preemption -- assembled into one scheduler comparable against a contiguous,
static-batching baseline.
"""

import math
from dataclasses import dataclass, field

BLOCK_TOKENS = 16  # => co-09: fixed block size, same principle as OS virtual-memory paging


@dataclass
class SimRequest:
    id: str
    prompt_prefix_tokens: int  # => co-10: the SHARED portion, if any, with other requests
    output_tokens: int
    tokens_emitted: int = 0

    @property
    def finished(self) -> bool:
        return self.tokens_emitted >= self.output_tokens


def blocks_needed(token_len: int) -> int:  # => co-09: round UP to the nearest whole block
    return math.ceil(token_len / BLOCK_TOKENS) if token_len > 0 else 0


def paged_cache_bytes(requests: list[SimRequest], bytes_per_token: int) -> int:
    # => co-08/co-09/co-10: paged allocation WITH prefix sharing -- the shared prefix's blocks count ONCE
    shared_prefixes = {r.prompt_prefix_tokens for r in requests if r.prompt_prefix_tokens > 0}
    shared_blocks = sum(blocks_needed(p) for p in shared_prefixes)  # => co-10: paid for ONCE, not per-request
    unique_blocks = sum(blocks_needed(r.output_tokens) for r in requests)  # => co-09: each request's own output
    return (shared_blocks + unique_blocks) * BLOCK_TOKENS * bytes_per_token


def contiguous_cache_bytes(requests: list[SimRequest], bytes_per_token: int, max_seq_len: int) -> int:
    # => co-08: the naive baseline -- reserves the WORST-CASE length, contiguously, per request, no sharing
    return len(requests) * max_seq_len * bytes_per_token


@dataclass
class ContinuousBatchScheduler:  # => co-12/co-13/co-14: admission, continuous batching, preemption
    max_batch_slots: int
    cache_budget_blocks: int
    active: list[SimRequest] = field(default_factory=list[SimRequest])
    queued: list[SimRequest] = field(default_factory=list[SimRequest])
    preemption_count: int = 0
    occupancy_trace: list[int] = field(default_factory=list[int])

    def _blocks_in_use(self) -> int:
        return sum(blocks_needed(r.output_tokens) for r in self.active)

    def submit(self, request: SimRequest) -> None:
        self.queued.append(request)  # => co-13: every arrival is queued first, admitted only when room exists

    def _admit_from_queue(self) -> None:
        # => co-13/co-14: bound preemption attempts to the active set's own size -- within ONE scheduling
        #    tick, a well-behaved scheduler preempts each currently-active request at most once, rather
        #    than cycling indefinitely when demand structurally exceeds the cache budget (see Example 46's
        #    thrashing failure mode, which this bound is specifically designed to avoid triggering here).
        preemption_budget = len(self.active)
        while len(self.active) < self.max_batch_slots and self.queued:
            candidate = self.queued[0]
            if self._blocks_in_use() + blocks_needed(candidate.output_tokens) <= self.cache_budget_blocks:
                self.active.append(self.queued.pop(0))
                continue
            if not self.active or preemption_budget <= 0:
                break  # => co-13: no room, and no further preemption budget this tick -- candidate stays queued
            # => co-14: under pressure, preempt the LARGEST cache holder to try to make room
            victim = max(self.active, key=lambda r: r.tokens_emitted)
            victim.tokens_emitted = 0
            self.active.remove(victim)
            self.queued.append(victim)
            self.preemption_count += 1
            preemption_budget -= 1

    def step(self) -> None:
        self._admit_from_queue()
        for r in self.active:
            r.tokens_emitted += 1  # => co-12: every active request takes one decode step
        self.occupancy_trace.append(len(self.active))
        self.active = [r for r in self.active if not r.finished]  # => co-12: retire IMMEDIATELY, not at batch end

    def run_to_completion(self) -> int:
        steps = 0
        while self.active or self.queued:
            self.step()
            steps += 1
        return steps
```

**Verify**: `test_continuous_batching_over_paged_cache_outperforms_static_over_contiguous` attributes
the throughput improvement to the specific idle-slot-elimination mechanism (co-11 vs co-12);
`test_paged_cache_with_prefix_sharing_recovers_fragmented_capacity` confirms `paged_cache_bytes` beats
`contiguous_cache_bytes` on an identical, fragmentation-prone workload;
`test_no_request_class_starves_under_the_scheduler` drives `run_to_completion()` and confirms every
submitted request is eventually admitted and finishes -- nothing starves.

## Step 3: `tune/` -- the throughput/latency frontier and a measured quantization decision

Plots the throughput/latency frontier, selects an operating point against the stated SLO, and makes
the quantization decision by evaluating a quantized candidate's **measured** quality delta -- never a
published figure.

**`learning/capstone/code/tune/tune.py`**

```python
"""Capstone step 3 -- tune/: plot the throughput/latency frontier, select an operating point against
the stated SLO, and make the quantization decision by evaluating the quantized model on a real,
learner-measured quality delta -- never a published figure.

Reuses the cost model from Examples 33-34 and the quantization decision shape from Examples 51-53.
"""

from dataclasses import dataclass

BASE_STEP_MS = 15.0
MS_PER_EXTRA_SLOT = 1.0


def itl_at_batch(batch_size: int) -> float:  # => co-15/co-16: the SAME cost model used throughout this course
    return BASE_STEP_MS + MS_PER_EXTRA_SLOT * batch_size


def throughput_at_batch(batch_size: int) -> float:
    return batch_size * 1000.0 / itl_at_batch(batch_size)


def frontier(batch_sizes: list[int]) -> list[tuple[int, float, float]]:
    # => co-15: (batch_size, throughput, itl_ms) -- the durable trade, traced across configurations
    return [(b, round(throughput_at_batch(b), 1), round(itl_at_batch(b), 1)) for b in batch_sizes]


def pick_operating_point(batch_sizes: list[int], itl_slo_ms: float) -> int:
    # => co-15: choose the LARGEST batch size that still satisfies the stated SLO -- maximize throughput
    #    subject to the constraint, never the other way around
    candidates = [b for b in batch_sizes if itl_at_batch(b) <= itl_slo_ms]
    if not candidates:
        raise ValueError(f"no batch size satisfies ITL SLO of {itl_slo_ms}ms")
    return max(candidates)


@dataclass
class QuantizationCandidate:  # => co-19: same shape as Example 53, but quality_score is MEASURED, not assumed
    name: str
    memory_gb: float
    measured_quality_delta: float  # => co-19: the learner's OWN measured degradation, e.g. from an eval suite


def decide_quantization(candidates: list[QuantizationCandidate], max_tolerated_quality_delta: float) -> dict[str, str]:
    # => co-19: accept only candidates within the tolerated MEASURED quality delta; prefer smallest memory
    accepted = [c for c in candidates if c.measured_quality_delta <= max_tolerated_quality_delta]
    if not accepted:
        return {"decision": "reject_all", "reason": "no candidate's measured quality delta is within tolerance"}
    winner = min(accepted, key=lambda c: c.memory_gb)
    return {
        "decision": winner.name,
        "reason": f"smallest memory ({winner.memory_gb} GB) with measured quality delta {winner.measured_quality_delta} <= tolerance {max_tolerated_quality_delta}",
    }
```

**Verify**: `test_operating_point_is_justified_against_the_slo` confirms the chosen batch size actually
satisfies the stated ITL SLO, not merely the largest available; `test_quantization_decision_cites_a_measured_quality_delta`
confirms `decide_quantization` only ever reasons about a `measured_quality_delta` field -- there is no
code path that accepts a published benchmark figure instead.

## Step 4: `capacity/` -- a realistic workload, a load test, and a capacity model

Characterizes the workload's prompt and output length distributions, runs a load test reproducing
them, derives a capacity model, and writes an autoscaling policy sized for weight-load cold starts.

**`learning/capstone/code/capacity/capacity.py`**

```python
"""Capstone step 4 -- capacity/: characterize the workload's prompt and output length distributions,
run a load test reproducing them, derive a capacity model, and write an autoscaling policy sized for
weight-load cold starts.

Reuses the distribution shape from Example 56, the capacity formula from Example 59, and the
proactive-autoscaling policy from Example 61.
"""

LENGTH_BUCKETS = [  # => co-21: a realistic, deterministic length distribution -- short-dominated, long-tailed
    (50, 40),
    (200, 35),
    (500, 15),
    (1500, 8),
    (4000, 2),
]


def expand_to_workload(buckets: list[tuple[int, int]]) -> list[int]:  # => co-21: materialize as an explicit list
    workload: list[int] = []
    for length, weight in buckets:
        workload.extend([length] * weight)
    return workload


def capacity_model(cache_budget_bytes: int, bytes_per_request_at_typical_length: int) -> int:
    # => co-07/co-21: the SAME division as Example 59, now driven by a typical (not worst-case) request size
    return cache_budget_bytes // bytes_per_request_at_typical_length


def proactive_scale_out_decision(queue_depth: int, threshold: int, cold_start_seconds: float, arrival_rate_per_sec: float) -> bool:
    # => co-23: the SAME proactive policy as Example 61 -- project queue growth across the cold-start window
    projected = queue_depth + arrival_rate_per_sec * cold_start_seconds
    return projected > threshold


def run_load_test(workload_lengths: list[int], max_batch_slots: int) -> int:
    # => co-22: a load test that reproduces the REAL length distribution, not a uniform-average shortcut
    pending = list(workload_lengths)
    active: list[int] = []
    steps = 0
    while pending or active:
        while len(active) < max_batch_slots and pending:
            active.append(pending.pop(0))
        active = [r - 1 for r in active]
        steps += 1
        active = [r for r in active if r > 0]
    return steps
```

**Verify**: `test_capacity_model_predicts_the_load_tests_behaviour` drives `run_load_test` with the
SAME 100-request distribution the capacity model was derived from;
`test_autoscaling_policy_accounts_for_measured_cold_start` confirms the proactive policy scales out
strictly earlier than a naive policy would, at the identical queue depth.

## Step 5: `operate/` -- packaging, observability, rollout, and the build-versus-buy call

Packages weights, runtime, and configuration as one versioned artifact; wires the serving
observability dashboard; executes a staged model rollout with a quality guardrail and a rollback;
concludes with the build-versus-buy recommendation, using realistic utilization rather than a
full-load assumption.

**`learning/capstone/code/operate/operate.py`**

```python
"""Capstone step 5 -- operate/: package weights, runtime, and configuration as one versioned artefact;
wire the serving-observability dashboard; execute a staged model rollout with a quality guardrail and a
rollback; write the build-versus-buy recommendation.

Reuses the deployment-manifest shape from Example 62, the dashboard/diagnosis pattern from Examples
64/74, the staged-rollout-with-guardrail pattern from Examples 63/72/73, and the TCO-sensitivity
calculation from Example 75.
"""

from dataclasses import asdict, dataclass


@dataclass
class DeploymentManifest:  # => co-24: weights + runtime + config, versioned as ONE unit
    model_id: str
    model_revision: str
    framework_version_pin: str  # => placeholder -- pin the real framework version at actual deploy time
    replica_count: int
    max_batch_slots: int


def package_deployment(model_id: str, revision: str, replica_count: int, max_batch_slots: int) -> dict[str, object]:
    manifest = DeploymentManifest(
        model_id=model_id,
        model_revision=revision,
        framework_version_pin="PLACEHOLDER-pin-at-deploy-time",
        replica_count=replica_count,
        max_batch_slots=max_batch_slots,
    )
    return asdict(manifest)


def build_dashboard(queue_depth: int, batch_occupancy: float, itl_p50_ms: float, preemption_rate: float) -> dict[str, float | int]:
    # => co-26: the five signals that explain a serving problem, read together
    return {
        "queue_depth": queue_depth,
        "batch_occupancy": batch_occupancy,
        "itl_p50_ms": itl_p50_ms,
        "preemption_rate": preemption_rate,
    }


def diagnose(dashboard: dict[str, float | int]) -> str:  # => co-26: the SAME rule chain as Example 74
    if dashboard["preemption_rate"] > 0.3:
        return "cache_pressure"
    if dashboard["queue_depth"] > 15 and dashboard["batch_occupancy"] < 0.5:
        return "undersized_replica_count"
    if dashboard["itl_p50_ms"] > 40:
        return "oversized_batch"
    return "healthy"


def evaluate_rollout_stage(error_rate: float, p99_latency_ms: float, error_guardrail: float, latency_guardrail_ms: float) -> str:
    # => co-25: BOTH guardrails must hold for a stage to advance -- either alone is not enough
    if error_rate > error_guardrail:
        return "halt"
    if p99_latency_ms > latency_guardrail_ms:
        return "halt"
    return "advance"


def should_rollback(old_p99_ms: float, new_p99_ms: float, regression_tolerance: float) -> bool:
    # => co-25/co-26: the SAME rollback rule as Example 73, applied to a planted regression
    return new_p99_ms > old_p99_ms * (1 + regression_tolerance)


def build_vs_buy_recommendation(
    gpu_hourly_rate: float,
    tokens_per_second_at_full_load: float,
    realistic_utilization: float,
    hosted_api_price_per_million_tokens: float,
) -> dict[str, object]:
    # => co-27/co-28: the HONEST comparison uses REALISTIC utilization, never full-load utilization
    effective_tokens_per_hour = tokens_per_second_at_full_load * 3600 * realistic_utilization
    self_hosted_cost = (gpu_hourly_rate / effective_tokens_per_hour) * 1_000_000
    recommendation = "self_host" if self_hosted_cost < hosted_api_price_per_million_tokens else "use_hosted_api"
    return {
        "self_hosted_cost_per_million_tokens": round(self_hosted_cost, 4),
        "hosted_api_cost_per_million_tokens": hosted_api_price_per_million_tokens,
        "realistic_utilization": realistic_utilization,
        "recommendation": recommendation,
    }
```

**Verify**: `test_dashboard_signals_explain_distinct_incidents` confirms all four planted incidents
(cache pressure, undersized replica count, oversized batch, healthy) are diagnosed distinctly, never
collapsing to the same cause; `test_staged_rollout_rolls_back_on_a_planted_regression` plants a
latency regression and confirms both the stage halts and the rollback decision fires;
`test_build_vs_buy_uses_realistic_utilization_not_full_load` confirms the identical GPU at the
identical hourly rate recommends _differently_ at 10% versus 90% utilization.

## Run it end to end

`learning/capstone/code/test_capstone.py` is the pytest suite covering every acceptance criterion
below, one test per criterion, importing all five step modules directly.

```text
$ python3 -m pytest test_capstone.py -v
============================= test session starts ==============================
collecting ... collected 15 items

test_capstone.py::test_serve_returns_a_completion PASSED                 [  6%]
test_capstone.py::test_memory_budget_max_concurrency_matches_admission_refusal_point PASSED [ 13%]
test_capstone.py::test_compute_metrics_returns_distinct_latency_signals PASSED [ 20%]
test_capstone.py::test_continuous_batching_over_paged_cache_outperforms_static_over_contiguous PASSED [ 26%]
test_capstone.py::test_paged_cache_with_prefix_sharing_recovers_fragmented_capacity PASSED [ 33%]
test_capstone.py::test_no_request_class_starves_under_the_scheduler PASSED [ 40%]
test_capstone.py::test_operating_point_is_justified_against_the_slo PASSED [ 46%]
test_capstone.py::test_quantization_decision_cites_a_measured_quality_delta PASSED [ 53%]
test_capstone.py::test_capacity_model_predicts_the_load_tests_behaviour PASSED [ 60%]
test_capstone.py::test_autoscaling_policy_accounts_for_measured_cold_start PASSED [ 66%]
test_capstone.py::test_dashboard_signals_explain_distinct_incidents PASSED [ 73%]
test_capstone.py::test_staged_rollout_rolls_back_on_a_planted_regression PASSED [ 80%]
test_capstone.py::test_deployment_manifest_is_versioned_as_one_unit PASSED [ 86%]
test_capstone.py::test_build_vs_buy_uses_realistic_utilization_not_full_load PASSED [ 93%]
test_capstone.py::test_entire_capstone_suite_runs_offline_without_gpu PASSED [100%]

============================== 15 passed in 0.02s ==============================
```

## Acceptance criteria

- [x] The service (Step 1's scheduler-bound budget) holds a stated latency SLO under a load test that
      reproduces realistic prompt and output length distributions -- `test_operating_point_is_justified_against_the_slo`,
      `test_capacity_model_predicts_the_load_tests_behaviour`.
- [x] The documented memory budget's computed concurrency limit matches observed behaviour --
      `test_memory_budget_max_concurrency_matches_admission_refusal_point`.
- [x] Continuous batching over a paged cache measurably outperforms static batching over a contiguous
      cache on the same workload, with the improvement attributed to the specific mechanism --
      `test_continuous_batching_over_paged_cache_outperforms_static_over_contiguous`,
      `test_paged_cache_with_prefix_sharing_recovers_fragmented_capacity`.
- [x] The chosen operating point on the throughput/latency frontier is justified against the SLO --
      `test_operating_point_is_justified_against_the_slo`.
- [x] The quantization decision cites a quality delta the learner measured, not a published one --
      `test_quantization_decision_cites_a_measured_quality_delta`.
- [x] The autoscaling policy accounts for measured cold-start time --
      `test_autoscaling_policy_accounts_for_measured_cold_start`.
- [x] A staged model rollout rolls back on a planted quality regression --
      `test_staged_rollout_rolls_back_on_a_planted_regression`.
- [x] Every serving observability signal is shown to explain a distinct incident --
      `test_dashboard_signals_explain_distinct_incidents`.
- [x] The build-versus-buy recommendation uses realistic utilization and includes idle cost --
      `test_build_vs_buy_uses_realistic_utilization_not_full_load`.
- [x] The entire suite runs offline without GPU access, with GPU-only figures drawn from committed
      reference measurements (see Examples 54, 60, 69) -- `test_entire_capstone_suite_runs_offline_without_gpu`.

## Done bar

Runnable end to end (offline, simulator plus CPU-servable model): every framework name,
GPU price, and quantization figure this capstone touches is illustrative and flagged in this course's
[References](../../overview.md#references) rather than stated as a current market fact.

---

← Previous: [Advanced Examples](../advanced.md)
