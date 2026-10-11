---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Creating AI-Powered Apps](../creating-ai-powered-apps/overview.md) (tokens,
  context windows, what a completion request is);
  [Backend at Scale](../backend-at-scale/overview.md) (load, queueing, capacity, autoscaling);
  [Containers and Orchestration](../containers-and-orchestration/overview.md) (packaging and
  scheduling a workload); [Computer Architecture](../computer-architecture/overview.md) (memory
  hierarchy and bandwidth, the entire reason decode behaves as it does);
  [Site Reliability Engineering](../site-reliability-engineering/overview.md) (SLOs, load
  testing, capacity planning); [Just Enough Python](../just-enough-python/learning/overview.md).
- **Tools & environment**: a macOS/Linux terminal; Python 3.x (`python3 --version`); no GPU and no
  paid API key are required anywhere in this topic. Every example runs against a small,
  deterministic, in-process scheduler-and-cache **simulator** written for this topic -- the mechanics
  (batching policy, cache occupancy, preemption, admission control) are fully learnable and testable
  offline. A handful of advanced examples describe **[GPU]**-only measurements; those ship as
  committed reference numbers you read, not numbers you reproduce locally.
- **Assumed knowledge**: HTTP services and load testing; tokens and context windows; containers; the
  idea of a memory hierarchy, and that bandwidth -- not capacity -- is often the binding constraint.

## Why this exists -- the big idea

**The problem before the solution**: an engineer who has only ever called a hosted model API has no
mental model of what their token bill is buying, why latency behaves the way it does, why the same
hardware serves eight concurrent users comfortably and falls over at twelve, or whether self-hosting
would help. Serving looks like ordinary request/response infrastructure and is not -- the unit of
work is a token, a request's cost is unknown when it arrives, and the dominant resource is GPU memory
held for the duration of a generation, not CPU consumed at its start.

**The one idea worth keeping if you forget everything else**: generation is memory-bandwidth-bound,
the KV cache is the resource you are really scheduling, and every serving decision is a
throughput-versus-latency trade made explicit.

**Cross-cutting big ideas, taught here and reused across this topic**: `abstraction-and-its-cost` --
the token API hides a scheduler, a cache, and a memory budget you eventually have to see;
`taming-state` -- the KV cache is per-request mutable state whose lifetime and size dominate capacity;
`correctness-vs-pragmatism` -- quantization trades measurable quality for capacity, deliberately, and
only after you measure the trade rather than assume it.

This topic covers the durable **architecture** of transformer inference serving: the prefill/decode
split, the KV cache, continuous batching, paged cache allocation, scheduling and admission control,
GPU memory arithmetic, quantization, capacity planning, autoscaling, deployment, and observability.
Serving frameworks of the vLLM/TGI class are the concrete vehicle for a handful of examples and are
treated as **volatile** throughout -- every framework name, flag, and version claim is documented in
the References section, never in the durable spine, because these frameworks change substantially
within a single release cycle.

> **Scope guard -- serving infrastructure, not model application.** This topic is about **running**
> a model you already have -- the scheduler, the cache, the memory budget, the deployment. It does
> not teach prompting, retrieval, or agents; those live in
> [Creating AI-Powered Apps](../creating-ai-powered-apps/overview.md).
> It also does not teach evaluation, which lives in
> [evaluating-ai-output-essentials](../evaluating-ai-output-essentials/overview.md), nor fine-tuning
> a model's weights, which lives in
> [Fine-Tuning & Adaptation](../fine-tuning-and-adaptation/overview.md). If
> a question is "how do I make the model answer better," it belongs to those courses. If it is "how
> do I keep the GPU serving that model busy, fast, and within budget," it belongs here.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 75 runnable, heavily annotated Python examples across
  Beginner (Examples 1-28: the prefill/decode split, why decode is bandwidth-bound, the KV cache,
  cache-size arithmetic, the GPU memory budget, and the four-metric latency vocabulary), Intermediate
  (Examples 29-50: static versus continuous batching, the throughput/latency frontier, scheduling and
  admission control, chunked prefill, paged cache allocation, prefix sharing, and preemption), and
  Advanced (Examples 51-75: quantization evaluated rather than assumed, model parallelism, realistic
  load testing against a length distribution, capacity planning, GPU-aware autoscaling, deployment
  packaging, staged rollout, serving observability, and the build-versus-buy decision) -- plus a
  capstone that assembles a complete self-hosted inference service against a stated latency SLO.

Every example is a complete, self-contained `.py` file colocated under `learning/code/`, runnable
with `python3 example.py` and self-checked with `assert` statements -- there is no pseudocode
anywhere in this topic, and no example requires a GPU to run.

## Tensions & trade-offs -- when NOT to reach for this

- **Throughput vs latency**: every lever in this course moves the same slider. Larger batches serve
  more users per GPU-hour and make each user wait longer between tokens. There is no configuration
  that optimizes both, only a configuration chosen deliberately against a stated SLO -- which means
  you cannot tune a serving stack without first deciding which metric (co-16) you are accountable
  for.
- **Quantization vs quality**: lower precision buys real capacity and costs real quality (co-19), and
  the cost is task-dependent enough that a published degradation figure does not transfer to your
  workload. This is the clearest case in the course for measuring rather than trusting -- evaluate
  the quantized model on your own eval suite before accepting the trade.
- **Self-hosting vs an API**: self-hosting looks cheaper the moment you compare hourly GPU cost
  against per-token API pricing at full utilization (co-27, co-28), and that comparison is almost
  always wrong. Real utilization is spiky, idle GPUs bill continuously, and the operational load is a
  standing engineering commitment. The build-versus-buy calculation must use realistic utilization or
  it is not a calculation.
- **When NOT to reach for this**: if your traffic is low, spiky, or unpredictable, a hosted API is
  cheaper, faster to ship, and more elastic -- and the correct engineering decision. This topic
  exists to make that a reasoned conclusion rather than a default, and to equip you for the cases
  where it flips.
- **When NOT to self-host at all**: a team without GPU operations experience, without on-call
  coverage, and without a data-residency or model-control requirement forcing the issue should not be
  operating inference infrastructure. Recognising that is part of the material.

## References

> Fast-moving facts -- framework names, GPU pricing, benchmark and quality figures -- are stated
> below with their own volatility noted, rather than unqualified in the stable spine above or in any
> example.

- The prefill/decode split, the KV cache as the mechanism trading memory for recomputation, the
  memory-bandwidth-bound character of autoregressive decode, the arithmetic relating model weights
  and cache size to concurrency, continuous batching as the response to variable-length generation,
  and the throughput-versus-latency tension are architectural facts about transformer inference.
  They have been stable since the architecture was introduced and are independent of any serving
  framework.
- Volatile: every serving framework name (vLLM, TGI, and their successors), every version, every
  configuration flag, and every default. Frameworks in this space change substantially within a
  single release cycle. This topic's spine and examples name these frameworks only in passing, as
  the concrete vehicle for continuous batching and paged cache allocation (Examples 31 and 41) --
  never as a source of a version-pinned claim. Check a framework's current name, version, and flag
  surface in its own documentation before citing one in production.
- Volatile: GPU model names, VRAM capacities, memory bandwidths, hourly rental prices, and every
  hosted-API per-token price used in the build-versus-buy calculation (Example 65) and TCO
  sensitivity analysis (Example 75) are snapshots with a short half-life. The spine and examples
  teach the **calculation** using deliberately round, illustrative placeholder numbers (for
  example, a $2.00/GPU-hour rental price) rather than a currently-accurate market price -- re-source
  every input number against current vendor pricing before using this calculation for a real
  budgeting decision.
- Volatile: named memory-management and attention-kernel techniques (for example,
  PagedAttention-style block allocation) and their published speedup figures. This topic teaches the
  underlying problem -- cache fragmentation under variable-length generation, and the
  memory-bandwidth cost of attention -- as durable; every named technique and benchmark number here
  is unconfirmed, so check the technique's current publications before relying on a specific
  figure.
- Quantization format names (for example, INT8, INT4, FP8), their bit widths, and published
  quality-degradation measurements (Examples 51-53, 66-67) reflect what the field's publications
  said at the time of writing. The trade-off itself -- lower precision buys memory and speed at a
  measurable quality cost -- is durable; the specific format names and their measured costs are not.
  Any quality claim in this topic's examples uses a synthetic, illustrative scoring function rather
  than a published benchmark number, specifically to avoid an unverifiable citation.
- Every open-weights model name mentioned in passing in this topic's prose is illustrative only; no
  example in this topic downloads, loads, or depends on a specific model's weights -- every example
  runs against the in-process deterministic simulator described in Prerequisites above.
- This topic's "Confirm your toolchain" guidance and every worked-example transcript were captured
  against **Python 3.13**, run with `python3` from a macOS/Linux shell; if you re-run the examples
  on a materially later Python release, expect the printed versions to differ accordingly.

---

Next: [Learning Overview](./learning/overview.md) →
