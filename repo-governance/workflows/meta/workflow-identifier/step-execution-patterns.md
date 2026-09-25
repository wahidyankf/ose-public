---
description: The three step execution patterns — Sequential, Parallel, Conditional — with examples, plus how max-concurrency controls parallel fan-out.
when_to_use: Use when writing workflow steps and deciding whether they run sequentially, in parallel, or conditionally.
---

# Step Execution Patterns

Workflows support three step execution patterns:

## Sequential

Steps execute one after another. Later steps can reference outputs from earlier steps.

```markdown
### 1. Build Project (Sequential)

**Agent**: `swe-code-maker`

- **Args**: `action: build, project: ayokoding-www`
- **Output**: `{build-artifacts}`

### 2. Run Tests (Sequential)

**Agent**: `plan-execution-checker`

- **Args**: `target: {step1.outputs.build-artifacts}`
- **Depends on**: Step 1 completion
```

## Parallel

Steps execute simultaneously for efficiency.

```markdown
### 1. Validation Suite (Parallel)

Run all validators concurrently:

**Agent**: `docs-checker`

- **Args**: `scope: all`
- **Output**: `{docs-report}`

**Agent**: `docs-tutorial-checker`

- **Args**: `scope: all`
- **Output**: `{tutorial-report}`

**Agent**: `docs-link-checker`

- **Args**: `scope: all`
- **Output**: `{links-report}`

**Success criteria**: All three agents complete.
```

## Conditional

Steps execute only if conditions are met.

```markdown
### 3. Apply Fixes (Conditional)

**Agent**: `docs-fixer`

- **Args**: `report: {step1.outputs.docs-report}`
- **Condition**: `{step2.user-approved} == true`

Only runs if user approved fixes in step 2.
```

**Parallelization Control**:

The `max-concurrency` input parameter controls concurrent execution:

- **Default: 3** - The N in the N+1 model (`1 main thread + N background agents = N+1 total`), chosen to bound token/compute-budget burn
- **Increase** - Only when independent work, machine capacity, and budget headroom all allow (e.g., 4-8 for multi-validator workflows). Never self-promoted beyond the declared value
- **Decrease to 1** - Force sequential execution for debugging, or under budget, runner, or disk pressure
- **Set to validator count** - Maximum efficiency when validators are independent

The **DAG governs, N only caps**: the independent-node width sets the actual fan-out, so raising N
above that width buys nothing. Never force parallelism onto dependent nodes to fill a slot.

**Notes**:

- System automatically queues excess tasks when limit reached
- Independent validators with no shared state are ideal parallelization candidates
- Consider API rate limits and system resources when setting value
- Monitor execution performance to tune optimal value
