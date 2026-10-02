---
description: The four class-scoped discovery sweeps and the yield-over-risk ordering that decides which candidates reach the checkpoint first.
when_to_use: Use when running a grooming sweep's discovery pass, or ordering the resulting candidates.
---

# Steps 3-4 — Candidate Discovery and Ranking

## Step 3: Discovery (Parallel — one sweep per enabled class)

Each sweep runs only if its class is in the `classes` input. Every candidate records its class,
affected paths, measured yield in lines, and the evidence behind it.

### 3a. Fragmentation (Agent: `rules-checker`)

Admit a candidate when one of these holds:

- **Reabsorbable shard.** The shard has no inbound link from outside its own unit — its parent
  `.md` and its folder `README.md` are part of that unit and do not count as external — and it
  survives both packing limits in
  [Reabsorption Mechanics](./006-reabsorption-mechanics.md): packed per parent rather than per shard,
  and to 80% of the parent's budget rather than to its ceiling.
- **Single-child shard folder** whose parent has the headroom to reabsorb it. A parent already over
  budget is not a candidate however small its only child.
- **Index annotation longer than its target's body**, frontmatter excluded from both sides.
- **A frontmatter key that neither a gate, a generator, a harness, nor a convention requires.** All
  four, not just the first three: a key no validator reads may still be mandated by a convention,
  and removing it is then a convention change with its own obligation to place — not a mechanical
  cleanup, and not this class's zero risk. `created:` is exactly that case and is out of scope here.

Yield is the frontmatter, `Contents` line, and index-entry lines the merge removes.

### 3b. Duplication (Agent: `rules-checker`)

Admit an obligation whose Step 2 entry carries more than one location and no recorded keep
rationale. Nominate the canonical home by layer precedence, then narrowest binding surface.

**Every candidate carries a target-completeness check.** The surviving home must already cover every
case the removed statements covered; diff it against the removed text directly, because text search
cannot find an omission. A candidate that fails this check is not dropped — it is rewritten as
"complete the target first", which is a propagation item like any other.

### 3c. Retirement (Agent: `rules-checker`)

Admit only with evidence of one of: the subject no longer exists in the repository; a later rule
supersedes it in fact while leaving its text standing; or no surface reaches it and no gate cites
it. Absence of inbound links alone is insufficient — a rule may bind through a gate rather than a
link, and the sweep must check both.

### 3d. Scaffolding (Agent: `rules-checker`)

Admit a sentence only when it passes **both** the form test and the inventory test in
[Scaffolding Admission](./007-scaffolding-admission.md). Neither alone is sufficient, and modal absence
is not one of them. Yield is the removed lines. A file whose scaffolding is its only content is a
retirement candidate — route it to 3c rather than emptying it here.

- **Output**: Unranked candidate set.
- **On failure**: A sweep that cannot complete is reported and its class excluded; the run
  continues at `partial`.

## Step 4: Ranking (Sequential)

**Procedure**: Order candidates by measured yield divided by semantic risk, then group by subject
so that Step 6 can batch a subject's items into one propagation delivery.

Risk is set by class, not judged per item: fragmentation is zero, duplication and scaffolding are
low, retirement is high. The ordering that falls out is deliberate — the corpus gets its largest, safest reductions
first, and the run can be stopped after any batch with the remaining work still coherent.

Drop any candidate whose yield is under the noise floor: a reduction not worth a propagation
delivery is not worth a manifest line.

- **Depends on**: Step 3.
- **Output**: Ranked manifest at
  `local-tmp/rules-grooming/rules-grooming__<slug>__manifest.md`.
- **Success criteria**: Every candidate carries class, yield, risk, subject group, and evidence.
