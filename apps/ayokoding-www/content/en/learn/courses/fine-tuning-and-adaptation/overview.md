---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: `creating-ai-powered-apps` (prompting, structured output, and RAG -- the
  alternatives this course requires you to exhaust first) -- `[Unverified]` this course is not yet
  present in the AyoKoding course library on disk, so no link is given here; `evaluating-ai-systems-in-depth`
  (**hard prerequisite**: a fine-tune with no eval is unfalsifiable, and every decision in this
  course is an eval comparison) -- `[Unverified]` this course is not yet present in the AyoKoding
  course library on disk, so no link is given here;
  [Statistics for Evaluation](../statistics-for-evaluation/overview.md) (the base-versus-adapted
  comparison is a paired significance test, not two printed numbers);
  [Inference Serving & Model Deployment](../inference-serving-and-model-deployment/overview.md)
  (where an adapter is actually served);
  `data-engineering` (the dataset pipeline) -- `[Unverified]` this course is not yet present in the
  AyoKoding course library on disk, so no link is given here; **just enough python**
  ([4 · Just Enough Python](../just-enough-python/learning/overview.md)) is assumed for reading and
  writing fully type-annotated Python.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**; a small open-weights base model
  and a parameter-efficient fine-tuning library, both pinned CVE-clean at authoring; a training
  runtime. **GPU access is optional**: every example is sized to run on CPU or a small consumer GPU
  against a tiny mocked base model, so the mechanics, dataset work, and evaluation discipline are
  fully exercisable without a training cluster; runs requiring larger hardware are marked **[GPU]**
  and ship with committed reference artefacts, mocked so they still run offline.
- **Assumed knowledge**: the model-application material and its eval discipline; what tokens and a
  context window are; loading and transforming a dataset in Python; the idea of gradient-based
  training at a conceptual level. **No deep-learning course is assumed** -- this course explains what
  it needs and does not teach model architecture or backpropagation theory.

## Why this exists -- the big idea

**The problem before the solution**: fine-tuning is the intuitive response to "the model does not do
what I want," and it is usually the wrong one. It is reached for to inject knowledge -- which
retrieval does better, cheaper, and freshly -- far more often than to shape behaviour, which is the
thing it actually does well. The result is a recurring, expensive failure pattern: weeks of data
work and training produce a model that is stale on facts, worse on everything outside the training
distribution, harder to operate, and no better on the original complaint. **The one idea worth
keeping if you forget everything else**: fine-tuning teaches behaviour, not facts -- exhaust
prompting, retrieval, and scoping first, and when you do adapt, the dataset is the whole job.

**Cross-cutting big ideas**: `correctness-vs-pragmatism` -- adaptation is a costly bet on a measured
gap, not a default; `abstraction-and-its-cost` -- an adapter is a compact approximation of a full
fine-tune, with the trade-offs approximations carry; `taming-state` -- adapted weights are a
versioned artefact with a lifecycle, not a configuration change.

> **Deliberate de-emphasis -- read this before the rest of this page.** The production-AI framing
> this course follows treats fine-tuning as deliberately de-emphasized for application engineers --
> the discipline is knowing **when to do it and when to avoid it**, not treating weight adaptation as
> the default response to a quality problem. This course adopts that framing as its structure rather
> than reporting it as an aside. The first band is **not** how to fine-tune; it is how to establish
> that prompting, retrieval, and scoping have genuinely failed first, and how to recognise the
> specific and relatively narrow situations where adaptation is the right instrument. A learner who
> finishes this course and correctly decides **not** to fine-tune has used it as intended. (See
> [Accuracy notes](#accuracy-notes) for the corrected citation behind this framing.)

<!-- -->

> **Scope guard -- fine-tuning vs. `creating-ai-powered-apps` (the RAG foil).**
> `creating-ai-powered-apps` -- `[Unverified]` not yet present in the AyoKoding course library on
> disk, so no link is given here -- teaches prompting, structured output, and retrieval-augmented
> generation as the default toolkit for injecting knowledge into a model's output. This course does
> not re-teach any of that; it assumes you already know how to build a RAG pipeline and treats it as
> the alternative every case in this course's first band must fail to beat before adaptation is even
> a candidate. If the gap is "the model does not know X," the answer belongs in
> `creating-ai-powered-apps`'s retrieval material, not here.

<!-- -->

> **Scope guard -- fine-tuning vs. `evaluating-ai-systems-in-depth` (the eval machinery).**
> `evaluating-ai-systems-in-depth` -- `[Unverified]` not yet present in the AyoKoding course library
> on disk, so no link is given here -- owns error analysis, LLM-as-judge with measured human
> agreement, judge reliability, and statistical comparison machinery. This course is a **hard
> consumer** of that machinery, not a re-teacher of it: every "evaluate against the base" step in
> this course's third band assumes you can already build a paired comparison and read a significance
> test. If a technique is about _how to build or validate an evaluator_, it belongs to that course; if
> it is about _what to do with an adapted model once you have a trustworthy evaluator_, it belongs
> here.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 75 runnable, heavily annotated worked examples, grouped
  into the three named bands this course's own syllabus establishes (not a concept-centric theme
  split, and not a syntax-tiered Beginner/Intermediate/Advanced split either -- these bands track the
  _arc of a real adaptation decision_, from "should we even do this" through "build it" to "run and
  operate it"):
  - **Band A -- [The Decision, Not the Technique](./learning/band-a-the-decision-not-the-technique.md)**
    (examples 01-16, 51-58) -- measuring a real gap, triaging behaviour-shaped versus
    knowledge-shaped complaints, exhausting prompting/retrieval/scoping in that order, the written
    decision gate, legitimate cases the gate should pass, and the costs nobody budgets.
  - **Band B -- [The Dataset and the Training Run](./learning/band-b-the-dataset-and-the-training-run.md)**
    (examples 17-34, 59-67) -- assembling and auditing a supervised fine-tuning dataset, sourcing
    strategies and their biases, leak-free splits, full fine-tuning versus parameter-efficient
    adapters, rank as a capacity knob, and the hyperparameters that actually matter.
  - **Band C -- [Evaluation, Distillation, and Operation](./learning/band-c-evaluation-distillation-and-operation.md)**
    (examples 35-50, 68-75) -- the paired comparison against the base, the forgetting-regression
    suite, overfitting invisible in training loss, distillation's ceiling, serving and hot-swapping
    adapters, version pinning, and retirement.
  - **[Capstone](./learning/capstone/overview.md)** -- the complete adaptation arc for one real
    behaviour gap: a measured decision gate, a curated and audited dataset, a rank-justified adapter,
    a paired evaluation with a forgetting-regression suite, a served swappable artefact, and a
    written maintenance and retirement plan.

Every worked example is a complete, self-contained, fully type-annotated (strict `pyright`) runnable
Python file colocated under `learning/code/`, actually executed against **Python 3.13** to capture
its documented output -- every printed value on this topic's pages is a genuine, captured transcript,
never a fabricated one. Every example is CPU-or-small-consumer-GPU-runnable: the base model,
tokenizer, and trainer are mocked exactly the way a real object's shape and failure modes behave, so
nothing here requires a network call, a real GPU, a real Hugging Face download, or a paid API key.
Examples the underlying syllabus marks **[GPU]** are still written as mocked, offline-runnable
scripts, annotated to say plainly that a real run needs a GPU, and paired with a committed reference
artefact so the analysis stays reproducible without one.

- **[Drilling](./drilling/overview.md)** -- the spaced-repetition companion: one recall Q&A item per
  concept (32 total), applied problems, self-contained code katas, a self-check checklist, and
  elaborative-interrogation prompts.

## The 32 concepts this topic covers

- **co-01 -- behaviour-not-knowledge** -- fine-tuning reliably shapes form, style, format, and task
  behaviour; it is an unreliable and expensive way to install facts.
- **co-02 -- the-knowledge-injection-mistake** -- the most common and most costly misuse is
  fine-tuning to add facts, which produces a model stale from the moment training ends.
- **co-03 -- exhaust-prompting-first** -- a substantial share of gaps blamed on the model close with
  better instructions, examples, and output structure, at no training cost.
- **co-04 -- exhaust-retrieval-first** -- if the gap is missing information, retrieval solves it
  better, cheaper, and with facts that stay current.
- **co-05 -- exhaust-scoping-first** -- narrowing the task until the base model succeeds is
  frequently cheaper than adapting a model to a task that is too broad.
- **co-06 -- the-decision-procedure** -- a written, ordered gate -- measured gap, alternatives
  exhausted, behaviour-shaped not knowledge-shaped, data obtainable, evaluation possible -- passed
  before any training begins.
- **co-07 -- legitimate-fine-tuning-cases** -- consistent output format, a domain register or style,
  proprietary task behaviour with no textual description, latency or cost reduction via a smaller
  model, and tool-use patterns the base model handles poorly.
- **co-08 -- the-cost-nobody-budgets** -- data labour, training compute, evaluation, and the standing
  maintenance obligation of a model that must be re-adapted whenever the base changes.
- **co-09 -- supervised-fine-tuning** -- training on input/output pairs so the model learns to
  produce the target given the input.
- **co-10 -- dataset-is-the-work** -- outcome quality is determined by the dataset far more than by
  any training hyperparameter, and this is the single most under-weighted fact in the discipline.
- **co-11 -- dataset-quality-over-quantity** -- a few hundred consistent, correct, on-distribution
  examples routinely beat tens of thousands of noisy ones.
- **co-12 -- dataset-consistency** -- examples disagreeing with each other about the target
  behaviour teach the model to be inconsistent, and this failure is invisible until evaluation.
- **co-13 -- dataset-sourcing** -- production traffic, expert authoring, and synthetic generation
  each carry distinct bias, cost, and legal profiles.
- **co-14 -- synthetic-data-and-its-limits** -- generating training data from a larger model is fast
  and bounded by the teacher's own errors, which propagate silently.
- **co-15 -- train-validation-test-discipline** -- held-out splits are what keep a reported
  improvement from being memorization, and leakage between them invalidates everything downstream.
- **co-16 -- data-leakage-and-contamination** -- an evaluation case present in training data produces
  a result that does not transfer to production.
- **co-17 -- full-fine-tuning** -- updating all parameters is the most powerful and the most
  expensive option, and the most prone to degrading unrelated capability.
- **co-18 -- parameter-efficient-fine-tuning** -- training a small set of added parameters while
  freezing the base captures most of the benefit at a fraction of the cost.
- **co-19 -- low-rank-adaptation** -- the LoRA family injects trainable low-rank matrices into the
  model's layers, leaving base weights untouched.
- **co-20 -- rank-and-capacity** -- the adapter's rank bounds how much behaviour change it can
  express, trading capacity against size and overfitting risk.
- **co-21 -- adapters-are-composable-artefacts** -- adapters are small, versionable, swappable, and
  serveable independently of the base, which is an operational advantage over full fine-tuning.
- **co-22 -- catastrophic-forgetting** -- adaptation degrades capability outside the training
  distribution, and the degradation is invisible unless deliberately measured.
- **co-23 -- overfitting-in-fine-tuning** -- a small dataset trained too long memorizes rather than
  generalizes, and training loss will not reveal it.
- **co-24 -- hyperparameters-that-matter** -- learning rate, epochs, and adapter rank dominate; most
  other knobs are noise relative to dataset quality.
- **co-25 -- evaluate-against-the-base** -- the only meaningful result is a measured comparison
  against the unadapted base on the target task **and** on a regression suite covering untouched
  capability.
- **co-26 -- regression-suite-for-forgetting** -- an eval set of capabilities the fine-tune was not
  meant to change is what makes co-22 detectable.
- **co-27 -- distillation** -- training a smaller student to reproduce a larger teacher's behaviour,
  for latency and cost rather than for capability gain.
- **co-28 -- distillation-limits** -- the student inherits the teacher's errors and cannot exceed it;
  distillation is a cost optimization, not a quality one.
- **co-29 -- serving-an-adapted-model** -- adapters are loaded, swapped, and served against the
  stack from [Inference Serving & Model Deployment](../inference-serving-and-model-deployment/overview.md)
  -- with their own memory and routing implications.
- **co-30 -- the-maintenance-obligation** -- a fine-tune is pinned to a base-model version and to a
  data distribution; both drift, and re-adaptation is a recurring cost owned by whoever shipped it.
- **co-31 -- licensing-and-data-rights** -- base-model licences and training-data rights constrain
  what may be trained and shipped, and are verified before training rather than after.
- **co-32 -- when-to-undo-a-fine-tune** -- retiring an adapter in favour of a better base model or a
  retrieval solution is a normal, healthy outcome and should be planned for.

## Tensions & trade-offs -- when NOT to reach for this

- **Fine-tuning vs. retrieval**: this is the decision this course exists to get right. Retrieval
  keeps facts current, cites its sources, updates without retraining, and degrades gracefully.
  Fine-tuning bakes behaviour in at a fixed point in time. If the gap is "the model does not know X,"
  the answer is almost always retrieval; if it is "the model does not behave like Y," adaptation
  becomes a candidate -- and even then only after prompting and scoping have failed.
- **Fine-tuning vs. prompting**: a substantial share of quality gaps close with better instructions,
  few-shot examples, and enforced output structure -- at zero training cost, with instant iteration
  and no maintenance obligation. The iteration-speed difference alone usually decides it.
- **Parameter-efficient vs. full fine-tuning**: adapters are cheaper, faster, composable, and far
  less destructive to unrelated capability, at some ceiling on how much behaviour they can change.
  For nearly every application case the adapter is correct, and a full fine-tune should have to argue
  for itself against a measured adapter baseline.
- **Distillation's ceiling**: a distilled student cannot exceed its teacher and inherits its errors.
  Distillation buys latency and cost, never quality -- treating it as a quality technique guarantees
  disappointment.
- **When NOT to fine-tune, stated plainly**: when the gap is missing knowledge; when the base model
  has not been given a fair attempt with good prompting; when the task has not been scoped down; when
  you cannot assemble a few hundred consistent correct examples; when you have no eval suite to prove
  the adapted model beats the base; when the base model will be replaced by a better one before your
  maintenance cost amortizes; or when licensing forbids it. Each of these is common, and each alone
  is sufficient reason to stop.
- **The default expectation**: most application engineers will correctly decide not to fine-tune most
  of the time. That is the intended outcome of this course, not a failure of it.

## Accuracy notes

> Dated per this topic's own accuracy-note discipline: every volatile, version-pinned, or
> library-dependent fact below is flagged or dated here rather than stated unqualified in the stable
> spine above.

- 2026-07-26 -- **durable spine**: the distinction between teaching behaviour and injecting
  knowledge; the decision procedure ordering prompting, retrieval, and scoping ahead of adaptation;
  dataset quality dominating dataset size; low-rank adaptation as a _principle_ (training a small
  number of additional parameters instead of all of them); catastrophic forgetting and the
  base-model regression it causes; the mandate to evaluate an adapted model against the base it must
  beat; and distillation as behaviour transfer from a larger teacher. None of these depend on a
  library, a framework, or a model generation.
- 2026-07-26 -- **correction to this course's own syllabus source**: the "exhaust prompting/RAG/
  scoping before fine-tuning" framing quoted in the Deliberate de-emphasis section above was
  originally attributed, in this course's planning syllabus, to Chip Huyen's **"Designing Machine
  Learning Systems"** (O'Reilly, 2022). A `web-researcher` sweep completed 2026-07-26 found that
  attribution is likely wrong: the specific framing is documented as coming from Huyen's later,
  separate 2025 book **"AI Engineering: Building Applications with Foundation Models"** (O'Reilly,
  published 2025-01-07), specifically its Chapter 7
  ("Finetuning"), not the 2022 book. `[Needs Verification]` the exact quoted wording could not be
  verified against the primary O'Reilly text (paywalled) -- a secondary source (a public
  chapter-notes summary) paraphrases the chapter's stance as roughly "fine-tuning changes form, RAG
  supplies facts," but that paraphrase is not reproduced above as a direct quote. This course states
  the framing in its own words and cites "AI Engineering" (2025), Chapter 7, as the corrected source.
  Re-verify against the primary text if this course is revised.
- 2026-07-26 -- (source: Hu, Shen, Wallis, Allen-Zhu, Li, S. Wang, L. Wang & Chen, "LoRA: Low-Rank
  Adaptation of Large Language Models", arXiv:2106.09685, submitted 2021-06-17, v2 revised
  2021-10-16 -- https://arxiv.org/abs/2106.09685 ; accessed 2026-07-26) -- the full author list is
  **Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang,
  Weizhu Chen**. Two authors share the surname "Wang" (Shean Wang, Lu Wang); this course cites full
  given names, or "Hu et al." for short, and never a bare "Wang" to avoid ambiguity. The specific
  rank/alpha guidance and reported result figures the original paper reports are `[Needs
Verification]` against the primary source and are not reproduced as spine claims here -- this
  course teaches low-rank adaptation as a durable _principle_ and treats every numeric result as a
  dated, paper-specific figure.
- 2026-07-26 -- (source: Dettmers, Pagnoni, Holtzman & Zettlemoyer, "QLoRA: Efficient Finetuning
  of Quantized LLMs", arXiv:2305.14314, submitted 2023-05-23 -- https://arxiv.org/abs/2305.14314 ;
  accessed 2026-07-26) -- introduces 4-bit NormalFloat (NF4) quantization, double quantization, and
  paged optimizers. Referenced in this course's accuracy-note sidebars only, never as a spine claim.
- 2026-07-26 -- `[Unverified]` **volatile, accuracy-note only**: every fine-tuning library and
  trainer name, its API surface, its configuration keys, and its defaults. As of this date: `peft`
  current stable 0.19.1 (2026-04-16, requires Python >=3.10); `transformers` current stable 5.14.1
  (2026-07-16); `trl` current stable 1.9.0 (2026-07-21), shipping `SFTTrainer`, `GRPOTrainer`,
  `DPOTrainer`, and `KTOTrainer`; `bitsandbytes` current stable 0.50.0 (2026-07-24), whose GitHub org
  moved from the old personal `timdettmers/bitsandbytes` to `bitsandbytes-foundation/bitsandbytes`.
  Pin exact versions at authoring, keep library-specific configuration in an accuracy-note sidebar,
  and never state a spine concept in terms of a library's parameter name. This course's runnable code
  uses real, verified import statements and class names (`from peft import LoraConfig, TaskType,
get_peft_model`, `transformers.AutoModelForCausalLM`, `trl.SFTTrainer`) as illustrative, mocked
  code -- never a live call -- which is a different claim from stating a spine concept in terms of a
  library's parameter name.
- 2026-07-26 -- `[Unverified]` **volatile, licence-sensitive**: this course's running worked example
  uses `Qwen/Qwen2.5-0.5B-Instruct` on Hugging Face Hub as the small open-weights base model,
  licensed **Apache 2.0** as verified on the model's own card at authoring -- only some Qwen2.5 sizes
  are Apache 2.0 (the larger 3B/72B variants use a different, more restrictive licence), so this
  course always names the 0.5B checkpoint specifically, never "the Qwen2.5 family" generically. An
  alternative family, `HuggingFaceTB/SmolLM2-135M`/`-360M`/`-1.7B`, is also Apache 2.0 and appears in
  a handful of examples for variety. Re-verify licence terms at authoring time for any revision --
  a base model's permitted commercial use can change between releases.
- 2026-07-26 -- `[Unverified]` **volatile**: hosted fine-tuning-service pricing, GPU-hour costs, and
  any published benchmark improvement figure for a fine-tuned model are dated snapshots and do not
  appear in this course's stable spine; where a cost figure appears in a worked example, it is a
  clearly-labelled illustrative placeholder, not a live-sourced number.
- 2026-07-26 -- `[Unverified]` **volatile**: quantized-training and adapter-merging technique names
  and their published memory/quality figures. This course teaches the underlying trade (a smaller
  trained-parameter footprint approximates a full fine-tune's benefit) as durable and treats every
  named technique and number as dated.
- 2026-07-26 -- **confirmed accurate, reused as-is**: [Retrieval-Augmented Generation for
  Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) -- Patrick Lewis et al.,
  arXiv:2005.11401, submitted 2020-05-22; and [Language Models are Few-Shot
  Learners](https://arxiv.org/abs/2005.14165) -- Tom B. Brown et al., arXiv:2005.14165, submitted
  2020-05-28. Both citations were verified against the primary arXiv listing and needed no
  correction.

---

Next: [Learning Overview](./learning/overview.md) →
