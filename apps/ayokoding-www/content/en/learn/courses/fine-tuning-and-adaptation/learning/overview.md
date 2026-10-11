---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Creating AI-Powered Apps](/en/learn/courses/creating-ai-powered-apps) (prompting, structured output, and RAG -- the
  alternatives this course requires you to exhaust first);
  [Evaluating AI Systems In Depth](/en/learn/courses/evaluating-ai-systems-in-depth)
  (**hard prerequisite**: a fine-tune with no eval is unfalsifiable, and every decision in this
  course is an eval comparison);
  [Statistics for Evaluation](../../statistics-for-evaluation/overview.md) (the
  base-versus-adapted comparison is a paired significance test, not two printed numbers);
  [Inference Serving & Model Deployment](../../inference-serving-and-model-deployment/overview.md)
  (where an adapter is actually served); [Data Engineering](/en/learn/courses/data-engineering) (the
  dataset pipeline); **just
  enough python** ([Just Enough Python](../../just-enough-python/learning/overview.md)) is
  assumed for reading and writing fully type-annotated Python.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**, the standard library only
  (`json`, `math`, `dataclasses`, `pathlib`, `typing`) -- no fine-tuning library, no network call, no
  real Hugging Face download, and no paid API key is required anywhere in this topic, deliberately.
  Every base model, tokenizer, and trainer this topic's examples reference is mocked exactly the way
  a real object's shape and failure modes behave.
- **Assumed knowledge**: the model-application material and its eval discipline; what tokens and a
  context window are; loading and transforming a dataset in Python; the idea of gradient-based
  training at a conceptual level. **No deep-learning course is assumed** -- this course explains what
  it needs and does not teach model architecture or backpropagation theory.

## Why this exists -- the big idea

**The problem before the solution**: fine-tuning is the intuitive response to "the model does not do
what I want," and it is usually the wrong one. **The one idea worth keeping if you forget everything
else**: fine-tuning teaches behaviour, not facts -- exhaust prompting, retrieval, and scoping first,
and when you do adapt, the dataset is the whole job.

**Cross-cutting big ideas**: `correctness-vs-pragmatism` -- adaptation is a costly bet on a measured
gap, not a default; `abstraction-and-its-cost` -- an adapter is a compact approximation of a full
fine-tune, with the trade-offs approximations carry; `taming-state` -- adapted weights are a
versioned artefact with a lifecycle, not a configuration change.

## Confirm your toolchain

Every example in this topic is standard-library-only -- no fine-tuning library, no network call, no
real GPU, and no paid API key required anywhere:

```text
$ python3 --version
Python 3.13.12
$ python3 -c "import json, math, dataclasses, pathlib, typing; print('stdlib primitives OK')"
stdlib primitives OK
$ pyright --version
pyright 1.1.411
$ ruff --version
ruff 0.15.9
```

_Captured 2026-07-26 -- these are point-in-time patch versions, not a durable claim; see this
topic's [References](../overview.md#references) if you are reading this after a later patch
has shipped._

Every worked example is a complete, self-contained, fully type-annotated (strict `pyright`) runnable
Python file colocated under `learning/code/`, actually executed against **Python 3.13** to capture
its documented output -- every printed value on this topic's pages is a genuine, captured transcript,
never a fabricated one. Every code-bearing worked example is independently runnable with no
cross-example imports; the capstone's five files are the sole exception, each committing a JSON
artefact the next step's file reads, so the five steps run as one small, ordered project.

## How this topic's examples are organized

- **[Band A -- The Decision, Not the Technique](./band-a-the-decision-not-the-technique.md)**
  (Examples 1-16, 51-58) -- measuring a real gap, triaging behaviour-shaped versus knowledge-shaped
  complaints, exhausting prompting/retrieval/scoping in that order, the written decision gate,
  legitimate cases the gate should pass, and the costs nobody budgets.
- **[Band B -- The Dataset and the Training Run](./band-b-the-dataset-and-the-training-run.md)**
  (Examples 17-34, 59-67) -- assembling and auditing a supervised fine-tuning dataset, sourcing
  strategies and their biases, leak-free splits, full fine-tuning versus parameter-efficient
  adapters, rank as a capacity knob, and the hyperparameters that actually matter.
- **[Band C -- Evaluation, Distillation, and Operation](./band-c-evaluation-distillation-and-operation.md)**
  (Examples 35-50, 68-75) -- the paired comparison against the base, the forgetting-regression
  suite, overfitting invisible in training loss, distillation's ceiling, serving and hot-swapping
  adapters, version pinning, and retirement.
- **[Capstone](./capstone/overview.md)** -- the complete adaptation arc for one real behaviour gap: a
  measured decision gate, a curated and audited dataset, a rank-justified adapter, a paired
  evaluation with a forgetting-regression suite, a served swappable artefact, and a written
  maintenance and retirement plan.

## Read more

- **AI Engineering: Building Applications with Foundation Models** -- Chip Huyen (O'Reilly, 2025).
  The corrected source for this course's "exhaust prompting/RAG/scoping before fine-tuning" framing
  -- see this topic's [References](../overview.md#references) for the correction detail.
- **LoRA: Low-Rank Adaptation of Large Language Models** -- Hu, Shen, Wallis, Allen-Zhu, Li, S. Wang,
  L. Wang & Chen, arXiv:2106.09685 (2021). The originating paper for the low-rank-adaptation
  principle this course teaches as durable. <https://arxiv.org/abs/2106.09685>
- **Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks** -- Patrick Lewis et al.
  (2020). The alternative this course requires you to rule out before adapting weights.
  <https://arxiv.org/abs/2005.11401>
- **Language Models are Few-Shot Learners** -- Tom B. Brown et al. (2020). The result that made
  instruction-and-example steering a substitute for task-specific training.
  <https://arxiv.org/abs/2005.14165>

## Examples by Level

### Beginner (Examples 1–16, 51–58)

- [Worked Example 1: Measure the Gap First](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-1-measure-the-gap-first)
- [Worked Example 2: Behaviour-vs-Knowledge Triage](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-2-behaviour-vs-knowledge-triage)
- [Worked Example 3: The Knowledge-Injection Mistake](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-3-the-knowledge-injection-mistake)
- [Worked Example 4: Retrieval Beats It](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-4-retrieval-beats-it)
- [Worked Example 5: Prompting Closes the Gap](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-5-prompting-closes-the-gap)
- [Worked Example 6: Structured Output Closes the Gap](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-6-structured-output-closes-the-gap)
- [Worked Example 7: Scoping Closes the Gap](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-7-scoping-closes-the-gap)
- [Worked Example 8: The Decision Procedure](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-8-the-decision-procedure)
- [Worked Example 9: A Correct No-Go](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-9-a-correct-no-go)
- [Worked Example 10: Legitimate Case -- Format](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-10-legitimate-case----format)
- [Worked Example 11: Legitimate Case -- Register](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-11-legitimate-case----register)
- [Worked Example 12: Legitimate Case -- Smaller Model](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-12-legitimate-case----smaller-model)
- [Worked Example 13: Total Cost of a Fine-Tune](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-13-total-cost-of-a-fine-tune)
- [Worked Example 14: The Maintenance Obligation](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-14-the-maintenance-obligation)
- [Worked Example 15: Licence and Data-Rights Check](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-15-licence-and-data-rights-check)
- [Worked Example 16: The Decision Diagram](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-16-the-decision-diagram)
- [Worked Example 51: Legitimate Case -- Tool Use](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-51-legitimate-case----tool-use)
- [Worked Example 52: A Knowledge-Heavy Request, Rejected](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-52-a-knowledge-heavy-request-rejected)
- [Worked Example 53: A Gap Too Small to Matter](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-53-a-gap-too-small-to-matter)
- [Worked Example 54: The Decision Procedure as Code, Table-Tested](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-54-the-decision-procedure-as-code-table-tested)
- [Worked Example 55: Comparing Alternatives Side by Side](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-55-comparing-alternatives-side-by-side)
- [Worked Example 56: A Request That Should Be Scoped, Not Trained](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-56-a-request-that-should-be-scoped-not-trained)
- [Worked Example 57: The Decision Record Template](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-57-the-decision-record-template)
- [Worked Example 58: Revisiting a No-Go Decision](/en/learn/courses/fine-tuning-and-adaptation/learning/band-a-the-decision-not-the-technique#worked-example-58-revisiting-a-no-go-decision)

### Intermediate (Examples 17–34, 59–67)

- [Worked Example 17: First SFT Dataset](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-17-first-sft-dataset)
- [Worked Example 18: Quality Beats Quantity](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-18-quality-beats-quantity)
- [Worked Example 19: Inconsistent Examples](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-19-inconsistent-examples)
- [Worked Example 20: Consistency Audit](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-20-consistency-audit)
- [Worked Example 21: Source from Production Traffic](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-21-source-from-production-traffic)
- [Worked Example 22: Expert-Authored Examples](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-22-expert-authored-examples)
- [Worked Example 23: Synthetic Generation](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-23-synthetic-generation)
- [Worked Example 24: Teacher Errors Propagate](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-24-teacher-errors-propagate)
- [Worked Example 25: Train/Validation/Test Split](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-25-trainvalidationtest-split)
- [Worked Example 26: Leakage Inflates the Result](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-26-leakage-inflates-the-result)
- [Worked Example 27: First Full Fine-Tune](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-27-first-full-fine-tune)
- [Worked Example 28: Full Fine-Tune Cost](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-28-full-fine-tune-cost)
- [Worked Example 29: First LoRA Adapter](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-29-first-lora-adapter)
- [Worked Example 30: Adapter vs. Full Cost](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-30-adapter-vs-full-cost)
- [Worked Example 31: Rank Sweep](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-31-rank-sweep)
- [Worked Example 32: Rank Too High Overfits](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-32-rank-too-high-overfits)
- [Worked Example 33: Learning Rate and Epochs](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-33-learning-rate-and-epochs)
- [Worked Example 34: Hyperparameters Cannot Fix Data](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-34-hyperparameters-cannot-fix-data)
- [Worked Example 59: Deduplicating the Dataset](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-59-deduplicating-the-dataset)
- [Worked Example 60: Balancing Task Coverage](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-60-balancing-task-coverage)
- [Worked Example 61: A Mixed Sourcing Strategy](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-61-a-mixed-sourcing-strategy)
- [Worked Example 62: Detecting Synthetic Drift](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-62-detecting-synthetic-drift)
- [Worked Example 63: Stratified Splitting](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-63-stratified-splitting)
- [Worked Example 64: Near-Duplicate Leakage](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-64-near-duplicate-leakage)
- [Worked Example 65: Targeted Modules and Adapter Placement](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-65-targeted-modules-and-adapter-placement)
- [Worked Example 66: Alpha and Rank Together](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-66-alpha-and-rank-together)
- [Worked Example 67: Early Warning Signs of Overfitting](/en/learn/courses/fine-tuning-and-adaptation/learning/band-b-the-dataset-and-the-training-run#worked-example-67-early-warning-signs-of-overfitting)

### Advanced (Examples 35–50, 68–75)

- [Worked Example 35: Evaluate Against the Base](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-35-evaluate-against-the-base)
- [Worked Example 36: Regression Suite](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-36-regression-suite)
- [Worked Example 37: Catastrophic Forgetting, Measured](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-37-catastrophic-forgetting-measured)
- [Worked Example 38: Forgetting Is Worse for Full Fine-Tune](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-38-forgetting-is-worse-for-full-fine-tune)
- [Worked Example 39: Overfitting Invisible in Training Loss](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-39-overfitting-invisible-in-training-loss)
- [Worked Example 40: Early Stopping on Validation](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-40-early-stopping-on-validation)
- [Worked Example 41: The Fine-Tune That Did Not Help](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-41-the-fine-tune-that-did-not-help)
- [Worked Example 42: Distil a Smaller Student](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-42-distil-a-smaller-student)
- [Worked Example 43: Student Cannot Exceed Teacher](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-43-student-cannot-exceed-teacher)
- [Worked Example 44: Distillation Decision Record](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-44-distillation-decision-record)
- [Worked Example 45: Serve an Adapter](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-45-serve-an-adapter)
- [Worked Example 46: Hot-Swap Adapters](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-46-hot-swap-adapters)
- [Worked Example 47: Adapter Memory and Routing](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-47-adapter-memory-and-routing)
- [Worked Example 48: Version-Pinning to a Base](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-48-version-pinning-to-a-base)
- [Worked Example 49: Retire an Adapter](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-49-retire-an-adapter)
- [Worked Example 50: Capstone-Justified Adaptation](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-50-capstone-justified-adaptation)
- [Worked Example 68: Statistical Significance of the Improvement](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-68-statistical-significance-of-the-improvement)
- [Worked Example 69: Regression Suite Severity Weighting](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-69-regression-suite-severity-weighting)
- [Worked Example 70: A Fine-Tune That Helped and Hurt](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-70-a-fine-tune-that-helped-and-hurt)
- [Worked Example 71: Distillation with a Held-Out Teacher Eval](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-71-distillation-with-a-held-out-teacher-eval)
- [Worked Example 72: Adapter Registry and Discovery](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-72-adapter-registry-and-discovery)
- [Worked Example 73: Load-Testing Adapter Swaps](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-73-load-testing-adapter-swaps)
- [Worked Example 74: A Licence-Blocked Retirement](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-74-a-licence-blocked-retirement)
- [Worked Example 75: Writing the Maintenance and Retirement Plan](/en/learn/courses/fine-tuning-and-adaptation/learning/band-c-evaluation-distillation-and-operation#worked-example-75-writing-the-maintenance-and-retirement-plan)

---

← Previous: [Overview](../overview.md) &middot; Next: [Band A: The Decision, Not the Technique](./band-a-the-decision-not-the-technique.md) →
