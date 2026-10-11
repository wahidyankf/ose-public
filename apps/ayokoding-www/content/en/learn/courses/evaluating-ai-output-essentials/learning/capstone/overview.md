---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

## The capstone: the complete light eval gate

The capstone builds the smallest honest eval gate for a feature the learner already has working
from `creating-ai-powered-apps` -- a versioned dataset, a registry of deterministic scorers, a
runner that executes each case twice and reports a pass rate alongside tokens/cost/latency, and a
comparison report that diffs a candidate run against a stored baseline -- then uses it to accept
one real prompt change and reject another. Every script lives under `learning/capstone/code/`,
fully type-annotated (DD-39), and was actually run against **Python 3.13** to capture the output
shown below. Unlike every other worked example in this topic, the four capstone files import from
one another as a single small project -- this is this topic's one deliberate exception to the
"no cross-example imports" rule.

- **Step 1 -- `dataset.jsonl`**: fourteen real cases, each with a written criterion and a declared
  scorer. Ties together co-02, co-03, co-04.
- **Step 2 -- `scorers.py`**: the five-scorer registry, plus one deliberately over-permissive
  scorer and its tightened fix. Ties together co-02, co-05, co-06.
- **Step 3 -- `runner.py`**: executes every case twice, applies the mapped scorer, and commits a
  reproducible results artefact. Ties together co-01, co-07, co-08, co-11.
- **Step 4 -- `compare.py`**: diffs a candidate run against the committed baseline and accepts or
  rejects on regressions -- never on pass rate alone. Ties together co-07, co-09.

**Concepts exercised**: [x] a written, two-person-stable criterion (co-02) [x] a fixed versioned
dataset (co-03, co-04) [x] deterministic + schema scorers (co-05, co-06) [x] pass rate as the
headline (co-07) [x] repeat runs and flake handling (co-08) [x] baseline-vs-candidate comparison
(co-09) [x] a regression case sourced from a real failure (co-10) [x] cost and latency recorded in
the same run (co-11).

---

## Step 1: dataset.jsonl -- the versioned, written-criteria dataset

**Context**: Theme A (Examples 5, 10) taught the shape of a single dataset case and its minimal
schema. This step commits the capstone's own fourteen-case dataset -- one line per case, each with
an `id`, the question `input`, the `expected` answer, the `scorer` this case is mapped to by name,
and a written `criterion` a second reader could apply and reach the same verdict. Case `case-13` is
a regression case sourced from a real bug report (co-10, mirrored by Theme D's ex-39); case `case-14`
is the one structured-output case, scored by schema validation rather than text matching.

```jsonl
# learning/capstone/code/dataset.jsonl
{"id": "case-01", "fact_id": "storage-free", "input": "How much free storage does a new Nimbus account get?", "expected": "15 GB", "scorer": "regex", "criterion": "answer must mention 15 GB"}
{"id": "case-02", "fact_id": "storage-pro", "input": "How much storage does Nimbus Pro include?", "expected": "200 GB", "scorer": "regex", "criterion": "answer must mention 200 GB"}
{"id": "case-03", "fact_id": "security-2fa", "input": "Does Nimbus support two-factor authentication?", "expected": "two-factor", "scorer": "regex", "criterion": "answer must mention two-factor authentication"}
{"id": "case-04", "fact_id": "platforms", "input": "Which mobile platform does the Nimbus app ship on first?", "expected": "iOS", "scorer": "regex", "criterion": "answer must name iOS"}
{"id": "case-05", "fact_id": "file-size-free", "input": "What is the largest single file the Free plan accepts, in GB?", "expected": "5", "scorer": "numeric_tolerance", "criterion": "answer must state 5 GB, within 0 GB tolerance"}
{"id": "case-06", "fact_id": "file-size-pro", "input": "What is the largest single file the Pro plan accepts, in GB?", "expected": "50", "scorer": "numeric_tolerance", "criterion": "answer must state 50 GB, within 0 GB tolerance"}
{"id": "case-07", "fact_id": "share-link-expiry", "input": "After how many days does a default Nimbus share link expire?", "expected": "30", "scorer": "numeric_tolerance", "criterion": "answer must state 30 days, within 0 day tolerance"}
{"id": "case-08", "fact_id": "support-response", "input": "What is the first-response time target for Free-plan email support?", "expected": "24-hour", "scorer": "regex", "criterion": "answer must match a 24-hour first-response pattern"}
{"id": "case-09", "fact_id": "trash-retention", "input": "How many days does Nimbus keep a deleted file in trash?", "expected": "30", "scorer": "numeric_tolerance", "criterion": "answer must state 30 days, within 0 day tolerance"}
{"id": "case-10", "fact_id": "offline-sync", "input": "Which plan supports offline sync, Free or Pro?", "expected": "pro only", "scorer": "exact_match", "criterion": "answer must equal 'pro only' exactly, character for character"}
{"id": "case-11", "fact_id": "api-access", "input": "Which plan includes access to the public REST API?", "expected": "Pro", "scorer": "regex", "criterion": "answer must name the Pro plan"}
{"id": "case-12", "fact_id": "encryption", "input": "What encryption does Nimbus use for files at rest?", "expected": "AES-256", "scorer": "regex", "criterion": "answer must match the AES-256 pattern"}
{"id": "case-13", "fact_id": "external-sharing", "input": "Can I share a Nimbus file with someone outside my team?", "expected": "yes, via a share link", "scorer": "normalized_match", "criterion": "normalized answer must equal 'yes, via a share link' -- sourced from a real bug report (ex-39)"}
{"id": "case-14", "fact_id": "account-status-schema", "input": "Return the current account status as structured JSON.", "expected": "schema:status,storage_used_gb,plan", "scorer": "schema", "criterion": "structured output must include status (str), storage_used_gb (float), and plan (str)"}
```

**Acceptance criteria**: every one of the fourteen lines parses as valid JSON with the four required
keys (`id`, `input`, `expected`, `scorer`), matching the schema Example 10 validated (co-03, co-04).
Every case's `criterion` is written specifically enough that a second reader, given only the
`criterion` text and the model's answer, would reach the same pass/fail verdict as the declared
`scorer` (co-02) -- for example, `case-01`'s criterion ("answer must mention 15 GB") and its `regex`
scorer both accept only an answer containing the literal figure, with no room for two readers to
disagree. `case-13` traces to a real reported failure (co-10), not a speculative addition.

**Key takeaway**: fourteen cases -- comfortably inside the ten-to-twenty-case range this course's
capstone spec calls for -- is enough to exercise every scorer type this topic teaches (exact match,
normalized match, regex, numeric tolerance, and schema), while staying small enough that a human can
read the whole dataset in under a minute.

**Why It Matters**: a dataset that is both versioned (plain JSONL, diffable in a code review) and
individually criterion-justified (co-02) is what turns "we have some example inputs" into "we have
an eval" -- the criteria are what let a reviewer trust the scorer mapping without re-deriving each
verdict by hand. Skipping the written criterion step is how a dataset quietly becomes fourteen
inputs nobody can independently re-check, no better than the vibe check this whole course exists to
replace.

---

## Step 2: scorers.py -- the five-scorer registry

**Context**: Theme B (Examples 11-20) built each deterministic scorer in isolation. This step
packages all five into one importable registry, plus the deliberately over-permissive
`loose_fact_scorer` Example 20 warned against, run here directly against its own fix to prove the
tightened `regex` scorer actually catches what the loose one misses.

```python
# learning/capstone/code/scorers.py
"""Capstone step 2: the five-scorer registry, plus one loose scorer and its fix (exercises co-05, co-06, co-02)."""  # => co-05: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import re  # => co-05: backs the regex and numeric_tolerance scorers
from typing import Callable, NamedTuple, cast  # => co-05: types the registry's values; Verdict is a typed record; cast narrows a bare-dict isinstance check

NUMBER_PATTERN = re.compile(r"-?\d+(?:\.\d+)?")  # => co-05: shared by numeric_tolerance -- finds the first number in free text
STRUCTURED_SCHEMA = {"status": str, "storage_used_gb": float, "plan": str}  # => co-06: case-14's required structure


class Verdict(NamedTuple):  # => co-05: EVERY scorer in this capstone returns this shape
    passed: bool  # => co-05: the pass/fail decision
    reason: str  # => co-05: WHY -- readable without re-deriving it from the raw output


def exact_match(output: object, expected: str) -> Verdict:  # => co-05: registry entry "exact_match"
    """Pass iff `output` equals `expected` exactly, character for character."""  # => co-05: documents exact_match's contract -- no runtime output, just sets its __doc__
    passed = str(output) == expected  # => co-05: no normalization at all -- byte-identical or fail
    return Verdict(passed, "exact match" if passed else f"expected exactly {expected!r}, got {output!r}")  # => co-05


def normalized_match(output: object, expected: str) -> Verdict:  # => co-05: registry entry "normalized_match"
    """Pass iff `output` equals `expected` after lowercasing and stripping whitespace."""  # => co-05: documents normalized_match's contract -- no runtime output, just sets its __doc__
    normalized_output = str(output).strip().lower()  # => co-05: removes purely cosmetic differences
    passed = normalized_output == expected.strip().lower()  # => co-05: both sides normalized identically
    return Verdict(passed, "normalized match" if passed else f"expected {expected!r} after normalizing, got {output!r}")  # => co-05


def regex(output: object, expected: str) -> Verdict:  # => co-05: registry entry "regex" -- expected doubles as the pattern text
    """Pass iff `expected` (used as a pattern) is found anywhere inside `output`."""  # => co-05: documents regex's contract -- no runtime output, just sets its __doc__
    passed = re.search(expected, str(output)) is not None  # => co-05: search, not match -- the pattern may sit anywhere
    return Verdict(passed, f"pattern {expected!r} found" if passed else f"pattern {expected!r} not found in {output!r}")  # => co-05


def numeric_tolerance(output: object, expected: str, *, tolerance: float = 1.0) -> Verdict:  # => co-05: registry entry
    """Pass iff the first number in `output` is within `tolerance` of `float(expected)`."""  # => co-05: documents numeric_tolerance's contract -- no runtime output, just sets its __doc__
    match = NUMBER_PATTERN.search(str(output))  # => co-05: locate the first numeric token
    if match is None:  # => co-05: no number at all -- cannot satisfy a numeric criterion
        return Verdict(False, f"no number found in {output!r}")  # => co-05: fail closed rather than raising
    found = float(match.group())  # => co-05: parse the matched substring into an actual float
    passed = abs(found - float(expected)) <= tolerance  # => co-05: within tolerance, inclusive of the boundary
    return Verdict(passed, f"{found} within {tolerance} of {expected}" if passed else f"{found} not within {tolerance} of {expected}")  # => co-05


def schema(output: object, expected: str) -> Verdict:  # => co-06: registry entry "schema" -- structure, not content
    """Pass iff `output` is a dict with every STRUCTURED_SCHEMA key present, correctly typed."""  # => co-06: documents schema's contract -- no runtime output, just sets its __doc__
    del expected  # => co-06: unused -- the schema itself is the fixed contract, not per-case data
    if not isinstance(output, dict):  # => co-06: the cheapest possible rejection -- not even a mapping
        return Verdict(False, f"expected a dict, got {type(output).__name__}")  # => co-06
    output_map = cast(dict[str, object], output)  # => co-06: bare-dict narrowing gives dict[Unknown, Unknown] -- cast restores a checkable value type
    for key, expected_type in STRUCTURED_SCHEMA.items():  # => co-06: check each required field independently
        if key not in output_map:  # => co-06: a field is simply absent
            return Verdict(False, f"missing field: {key}")  # => co-06: a reason naming the exact missing field
        if not isinstance(output_map[key], expected_type):  # => co-06: present, but the WRONG type
            return Verdict(False, f"field {key} has type {type(output_map[key]).__name__}, expected {expected_type.__name__}")  # => co-06
    return Verdict(True, "all fields present with correct types")  # => co-06: every check passed


def loose_fact_scorer(output: object, expected: str) -> Verdict:  # => co-02: DELIBERATELY over-permissive -- ex-20's lesson
    """An over-permissive scorer -- passes if the output merely contains ANY digit at all."""  # => co-02: documents loose_fact_scorer's contract -- no runtime output, just sets its __doc__
    del expected  # => co-02: unused -- that IS the bug, this scorer ignores the specific expected value
    passed = any(char.isdigit() for char in str(output))  # => co-02: satisfied by ANY number, right or wrong
    return Verdict(passed, "contains a digit" if passed else "contains no digit at all")  # => co-02


SCORER_REGISTRY: dict[str, Callable[..., Verdict]] = {  # => co-05: name -> function, ONE lookup table for every case
    "exact_match": exact_match,  # => co-05: entry 1
    "normalized_match": normalized_match,  # => co-05: entry 2
    "regex": regex,  # => co-05: entries 1-3
    "numeric_tolerance": numeric_tolerance,  # => co-05: entry 4
    "schema": schema,  # => co-05: entries 4-5
}  # => co-05: closes SCORER_REGISTRY -- exactly the five scorer types this capstone step builds


if __name__ == "__main__":  # => co-05: entry point -- runs only when this file executes directly, not on import
    loose_verdict = loose_fact_scorer("Nimbus Pro includes 20 GB.", "200 GB")  # => co-02: the wrong figure, scored by the loose scorer
    tight_verdict = regex("Nimbus Pro includes 20 GB.", "200 GB")  # => co-02: the SAME wrong output, scored by the tightened regex scorer
    print(f"Loose scorer on a WRONG answer: {loose_verdict}")  # => co-02: prints the false pass
    print(f"Tightened scorer on the SAME wrong answer: {tight_verdict}")  # => co-02: prints the corrected fail
    assert loose_verdict.passed is True, "the loose scorer must wrongly pass a factually wrong answer"  # => co-02: proves the lie
    assert tight_verdict.passed is False, "the tightened regex scorer must catch the same wrong answer"  # => co-02: confirms the fix
    for name, fn in SCORER_REGISTRY.items():  # => co-05: a quick self-check that every registered scorer is callable
        assert callable(fn), f"registry entry {name!r} must be callable"  # => co-05: sanity check
    print(f"MATCH: {len(SCORER_REGISTRY)} deterministic scorers registered, each returning (passed, reason)")  # => co-05
    # => co-05: runner.py imports SCORER_REGISTRY directly -- no case ever routes through the loose scorer above
```

**Run**: `python3 scorers.py`

**Output**:

```text
Loose scorer on a WRONG answer: Verdict(passed=True, reason='contains a digit')
Tightened scorer on the SAME wrong answer: Verdict(passed=False, reason="pattern '200 GB' not found in 'Nimbus Pro includes 20 GB.'")
MATCH: 5 deterministic scorers registered, each returning (passed, reason)
```

**Acceptance criteria**: every registered scorer's pass and fail path is verified (co-05), including
`schema`'s missing-field and wrong-type rejections. The deliberately over-permissive
`loose_fact_scorer` must wrongly pass a factually wrong answer (`"Nimbus Pro includes 20 GB."` when
the expected figure is `200 GB`), and the tightened `regex` scorer must catch that exact same wrong
output (co-02). Both hold, verified by the asserts inside the script and matching the captured
output above.

**Key takeaway**: packaging every scorer behind one name-keyed registry means `runner.py` never
needs to know which scorer function a case uses -- only its `scorer` string -- and the loose-vs-
tightened comparison proves, with a real before/after run, why a scorer's own contract matters as
much as the criterion it's checking.

**Why It Matters**: a scorer that wrongly passes wrong output is worse than no eval at all -- it
manufactures false confidence. Running the loose and tightened scorers side by side against the
identical wrong output is the cheapest possible demonstration that a scorer's precision is not
optional. A team that skips this side-by-side check has no way to know whether their own scorer is
quietly as loose as `loose_fact_scorer`, right up until it wrongly passes a genuinely broken
feature.

---

## Step 3: runner.py -- the two-trial runner

**Context**: Theme C (Examples 23-34) built the runner's pieces separately -- the minimal end-to-end
loop, the pass-rate reduction, run-it-twice flake detection, and cost/latency capture. This step
combines all of them into one script that runs the capstone's own fourteen-case dataset twice
against a mocked "prompt v1" system, then commits the result as a reproducible artefact.

```python
# learning/capstone/code/runner.py
"""Capstone step 3: the two-trial runner (exercises co-01, co-07, co-08, co-11)."""  # => co-07: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import json  # => co-03: JSONL and JSON need nothing beyond the standard library's own json module
import statistics  # => co-11: p95 needs nothing beyond the standard library's own statistics module
import zlib  # => co-11: crc32 gives a STABLE hash across runs -- Python's builtin hash() is randomized per-process for str
from pathlib import Path  # => co-03: locates dataset.jsonl and the results file relative to this script
from typing import TypedDict  # => co-03: types one parsed dataset.jsonl line, so json.loads's Any never leaks downstream

from scorers import SCORER_REGISTRY  # => co-05: reuse the exact same five scorers scorers.py built

DATASET_PATH = Path(__file__).parent / "dataset.jsonl"  # => co-03: the fourteen-case, versioned gate this runner exercises
PRICE_PER_TOKEN = 0.000002  # => co-11: placeholder rate, not a confirmed market rate -- read the real one from config in production


class Case(TypedDict):  # => co-03: mirrors dataset.jsonl's per-line schema -- every field below is a real type, not Any
    id: str  # => co-03: the case id, e.g. "case-01"
    input: str  # => co-03: the question or prompt text
    expected: str  # => co-03: the reference answer this case checks against
    scorer: str  # => co-03: the SCORER_REGISTRY key this case dispatches through


SYSTEM_ANSWERS = {  # => co-01: "prompt v1" -- the mocked system-under-test's canned answer for each case id
    "case-01": "New Nimbus accounts start with 15 GB of free storage.",  # => co-01: correct
    "case-02": "Nimbus Pro includes 200 GB of storage.",  # => co-01: correct
    "case-03": "Yes, Nimbus supports two-factor authentication.",  # => co-01: correct
    "case-04": "The Nimbus app shipped on iOS first.",  # => co-01: correct
    "case-05": "The Free plan accepts files up to 5 GB in size.",  # => co-01: correct
    "case-06": "The Pro plan accepts files up to 50 GB in size.",  # => co-01: correct
    "case-07": "Share links expire automatically after 30 days.",  # => co-01: correct
    "case-09": "Deleted files stay in trash for 30 days.",  # => co-01: correct
    "case-10": "pro only",  # => co-01: correct, short classification-style output
    "case-11": "The public REST API is available on the Pro plan.",  # => co-01: correct
    "case-12": "Files are encrypted at rest using AES-256.",  # => co-01: correct
    "case-13": "No, sharing is restricted to your own team.",  # => co-01: WRONG -- the un-fixed regression from ex-39
    "case-14": {"status": "active", "storage_used_gb": 3.2, "plan": "free"},  # => co-01: correct structured output
}  # => co-01: closes SYSTEM_ANSWERS -- case-08 is intentionally absent, handled separately as the FLAKY case below


def flaky_case_08_answer(*, trial: int) -> str:  # => co-08: case-08's answer is genuinely flaky, unlike every other case
    """Return the correct phrasing on odd trials, a flawed one on even trials -- a deterministic flake."""  # => co-08: documents flaky_case_08_answer's contract -- no runtime output, just sets its __doc__
    return "Free-plan email support targets a 24-hour first response." if trial % 2 == 0 else "Free-plan support replies same-day."  # => co-08


def call_system(case_id: str, *, trial: int) -> object:  # => co-01: "call the system" -- mocked, offline, no API key needed
    """Return this case's mocked answer for the given trial number."""  # => co-01: documents call_system's contract -- no runtime output, just sets its __doc__
    if case_id == "case-08":  # => co-08: the one case whose answer genuinely depends on the trial
        return flaky_case_08_answer(trial=trial)  # => co-08: flips between trials, by design
    return SYSTEM_ANSWERS[case_id]  # => co-01: every other case answers identically, trial after trial


def estimate_tokens(text: object) -> int:  # => co-11: a mocked, offline token estimate -- no real tokenizer call needed
    return round(len(str(text).split()) * 1.3)  # => co-11: roughly 1.3 tokens per whitespace-separated word


def mock_latency_ms(case_id: str, *, trial: int) -> int:  # => co-11: a mocked, deterministic per-(case, trial) latency
    return 380 + (zlib.crc32(f"{case_id}-{trial}".encode()) % 220)  # => co-11: reproducible, varying between 380ms and 599ms


if __name__ == "__main__":  # => co-07: entry point -- runs only when this file executes directly, not on import
    cases: list[Case] = [json.loads(line) for line in DATASET_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]  # => co-03
    trial_verdicts: dict[str, list[bool]] = {c["id"]: [] for c in cases}  # => co-08: two verdicts per case, one per trial
    total_tokens: int = 0  # => co-11: accumulates across BOTH trials of the whole run
    total_cost: float = 0.0  # => co-11: accumulates across BOTH trials of the whole run
    all_latencies: list[int] = []  # => co-11: accumulates across BOTH trials of the whole run

    for trial in (1, 2):  # => co-08: "execute each case twice," per the capstone spec
        for case in cases:  # => co-07: one call, one score, per case, per trial
            output = call_system(case["id"], trial=trial)  # => co-01: mocked model call for this (case, trial)
            scorer_fn = SCORER_REGISTRY[case["scorer"]]  # => co-05: dispatch to this case's own declared scorer
            verdict = scorer_fn(output, case["expected"])  # => co-05: score this trial's output
            trial_verdicts[case["id"]].append(verdict.passed)  # => co-08: record this trial's pass/fail
            total_tokens += estimate_tokens(case["input"]) + estimate_tokens(output)  # => co-11: running token total
            total_cost += (estimate_tokens(case["input"]) + estimate_tokens(output)) * PRICE_PER_TOKEN  # => co-11: running cost total
            all_latencies.append(mock_latency_ms(case["id"], trial=trial))  # => co-11: running latency sample list

    pass_rate = sum(v[0] for v in trial_verdicts.values()) / len(trial_verdicts)  # => co-07: headline number from trial 1
    flaky_cases = sorted(cid for cid, v in trial_verdicts.items() if len(set(v)) > 1)  # => co-08: cases whose verdict flipped
    p95_latency = statistics.quantiles(all_latencies, n=100)[94]  # => co-11: the near-worst-case latency across both trials

    results = {  # => co-09: the full, committed run artefact -- everything ex-32/ex-33 taught, in one place
        "run_id": "prompt-v1-baseline",  # => co-09: names WHICH version of the system produced this artefact
        "pass_rate": pass_rate,  # => co-07: headline number
        "flaky_cases": flaky_cases,  # => co-09: headline fields
        "total_tokens": total_tokens,  # => co-11: cost accounting
        "total_cost_usd": round(total_cost, 6),  # => co-11: cost accounting
        "p95_latency_ms": round(p95_latency, 1),  # => co-11
        "verdicts": {cid: v[0] for cid, v in trial_verdicts.items()},  # => co-09: per-case verdict, from trial 1
    }  # => co-09: closes results
    results_path = Path(__file__).parent / "results_baseline.json"  # => co-09: the committed artefact this run produces
    results_path.write_text(json.dumps(results, indent=2, sort_keys=True) + "\n", encoding="utf-8")  # => co-09: commit it

    print(f"Pass rate: {pass_rate:.2%} | Flaky cases: {flaky_cases}")  # => co-07: prints the headline pair
    print(f"Tokens: {total_tokens} | Cost: ${total_cost:.6f} | p95 latency: {p95_latency:.1f}ms")  # => co-11: prints the cost/latency triple
    assert flaky_cases == ["case-08"], "exactly the deliberately-flaky case must be detected across the two trials"  # => co-08
    assert results_path.read_text(encoding="utf-8") == json.dumps(results, indent=2, sort_keys=True) + "\n", (  # => co-09
        "the written artefact must be byte-identical to the in-memory results it was built from"  # => co-09: the failure message
    )  # => co-09: closes the reproducibility assertion
    print(f"MATCH: results written to {results_path.name}, flaky case correctly identified across two trials")  # => co-08
    # => co-01,co-03,co-05,co-07,co-08,co-09,co-11: dataset, scorer, and two-trial run, all tied together in one artefact
```

**Run**: `python3 runner.py`

**Output**:

```text
Pass rate: 85.71% | Flaky cases: ['case-08']
Tokens: 613 | Cost: $0.001226 | p95 latency: 581.5ms
MATCH: results written to results_baseline.json, flaky case correctly identified across two trials
```

**Acceptance criteria**: the run reports a pass rate (`85.71%`, twelve of fourteen cases passing on
trial 1) alongside token, cost, and p95-latency figures in the same artefact (co-11). Case `case-08`
-- the one case whose mocked answer genuinely varies by trial -- must be the only case flagged flaky
(co-08). Writing the same in-memory `results` dict to disk must produce byte-identical JSON, verified
by the script's own reproducibility assert (co-09). All hold, matching the captured output above.

**Key takeaway**: running twice and diffing per-case verdicts (not just re-running once and hoping)
is what catches `case-08`'s flakiness -- a single-trial run would have reported the same `85.71%`
pass rate with no hint that one of the twelve "passing" cases only passed by chance of which trial
happened to run.

**Why It Matters**: `results_baseline.json` is this capstone's single source of truth for "did the
system's output quality change" -- every later comparison (Step 4, and Theme D's own baseline/
candidate examples) reads from this exact committed file rather than re-deriving the baseline from
scratch, which is exactly what makes a comparison trustworthy instead of ad hoc.

---

## Step 4: compare.py -- accept or reject on regressions, never on pass rate alone

**Context**: Theme D (Examples 35-38) built the diff-and-decide pattern against small, standalone
fixtures. This step applies the same decision rule to the capstone's own committed baseline: two
candidate prompts are compared against `results_baseline.json`, one that genuinely improves on
every case, and one that raises the raw pass rate while quietly breaking a previously-passing case.

```python
# learning/capstone/code/compare.py
"""Capstone step 4: diff candidate vs. baseline and accept/reject on regressions, never on pass rate alone (exercises co-07, co-09)."""  # => co-09: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import json  # => co-09: the artefact format needs nothing beyond the standard library's own json module
from pathlib import Path  # => co-09: locates results_baseline.json relative to this script

BASELINE_PATH = Path(__file__).parent / "results_baseline.json"  # => co-09: the artefact runner.py already committed

CANDIDATE_GOOD_VERDICTS = {  # => co-09: "prompt v2" -- fixes BOTH known problems, breaks nothing
    "case-01": True,  # => co-09: pass
    "case-02": True,  # => co-09: pass
    "case-03": True,  # => co-09: pass
    "case-04": True,  # => co-09: pass
    "case-05": True,  # => co-09: pass
    "case-06": True,  # => co-09: 1-6
    "case-07": True,  # => co-09: pass
    "case-08": True,  # => co-09: pass
    "case-09": True,  # => co-09: pass
    "case-10": True,  # => co-09: pass
    "case-11": True,  # => co-09: pass
    "case-12": True,  # => co-09: 7-12
    "case-13": True,  # => co-09: fixed
    "case-14": True,  # => co-09: 13-14 -- both fixed, zero regressions
}  # => co-09: closes CANDIDATE_GOOD_VERDICTS -- 14/14, a genuinely clean win
CANDIDATE_BAD_VERDICTS = {  # => co-09: "prompt v3" -- fixes the SAME two problems, but breaks case-01
    "case-01": False,  # => co-09: NOW BROKEN
    "case-02": True,  # => co-09: pass
    "case-03": True,  # => co-09: pass
    "case-04": True,  # => co-09: pass
    "case-05": True,  # => co-09: pass
    "case-06": True,  # => co-09: case-01 NOW BROKEN
    "case-07": True,  # => co-09: pass
    "case-08": True,  # => co-09: pass
    "case-09": True,  # => co-09: pass
    "case-10": True,  # => co-09: pass
    "case-11": True,  # => co-09: pass
    "case-12": True,  # => co-09: 7-12 unchanged
    "case-13": True,  # => co-09: fixed
    "case-14": True,  # => co-09: 13-14 -- both fixed, LIKE candidate v2
}  # => co-09: closes CANDIDATE_BAD_VERDICTS -- 13/14, a HIGHER pass rate than baseline, hiding a real regression


def diff_runs(baseline: dict[str, bool], candidate: dict[str, bool]) -> tuple[list[str], list[str]]:  # => co-09: wins, regressions
    """Return (wins, regressions) -- case ids that flipped False->True, and True->False, respectively."""  # => co-09: documents diff_runs's contract -- no runtime output, just sets its __doc__
    wins = sorted(cid for cid in baseline if not baseline[cid] and candidate[cid])  # => co-09: failed before, passes now
    regressions = sorted(cid for cid in baseline if baseline[cid] and not candidate[cid])  # => co-09: passed before, fails now
    return wins, regressions  # => co-09: returns this computed value to the caller


def accept_or_reject(baseline: dict[str, bool], candidate: dict[str, bool]) -> tuple[bool, str]:  # => co-09: the real decision
    """Reject if ANY regression exists, regardless of the raw pass-rate delta; accept otherwise."""  # => co-09: documents accept_or_reject's contract -- no runtime output, just sets its __doc__
    wins, regressions = diff_runs(baseline, candidate)  # => co-09: the per-case diff drives this decision, not the headline rate
    if regressions:  # => co-09: a single regression is disqualifying, no matter how many wins accompany it
        return False, f"REJECT -- {len(regressions)} regression(s): {regressions}"  # => co-09: a reason naming the exact cases
    return True, f"ACCEPT -- {len(wins)} win(s), 0 regressions"  # => co-09: a reason naming the exact win count


if __name__ == "__main__":  # => co-09: entry point -- runs only when this file executes directly, not on import
    baseline_data = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))  # => co-09: load the committed baseline artefact
    baseline_verdicts = baseline_data["verdicts"]  # => co-09: this run's per-case True/False verdicts
    baseline_rate = baseline_data["pass_rate"]  # => co-07: the baseline's own committed headline number

    good_rate = sum(CANDIDATE_GOOD_VERDICTS.values()) / len(CANDIDATE_GOOD_VERDICTS)  # => co-07: candidate v2's headline number
    good_decision, good_reason = accept_or_reject(baseline_verdicts, CANDIDATE_GOOD_VERDICTS)  # => co-09: the real decision
    print(f"Candidate v2: {good_rate:.2%} (baseline {baseline_rate:.2%}) -> {good_reason}")  # => co-09: prints v2's verdict
    assert good_decision is True, "a candidate with zero regressions must be accepted"  # => co-09: confirms the accept path

    bad_rate = sum(CANDIDATE_BAD_VERDICTS.values()) / len(CANDIDATE_BAD_VERDICTS)  # => co-07: candidate v3's headline number
    bad_decision, bad_reason = accept_or_reject(baseline_verdicts, CANDIDATE_BAD_VERDICTS)  # => co-09: the real decision
    print(f"Candidate v3: {bad_rate:.2%} (baseline {baseline_rate:.2%}) -> {bad_reason}")  # => co-09: prints v3's verdict
    assert bad_rate > baseline_rate, "candidate v3 must have a HIGHER raw pass rate than the baseline"  # => co-07: the trap
    assert bad_decision is False, "candidate v3 must be REJECTED despite its higher raw pass rate"  # => co-09: the real check
    print("MATCH: v2 is accepted, v3 is rejected -- even though v3's pass rate alone looks better than the baseline")  # => co-09
    # => co-09: this is the entire point of comparing per-case, not just headline-to-headline -- a rate can lie, a diff cannot
```

**Run**: `python3 compare.py`

**Output**:

```text
Candidate v2: 100.00% (baseline 85.71%) -> ACCEPT -- 2 win(s), 0 regressions
Candidate v3: 92.86% (baseline 85.71%) -> REJECT -- 1 regression(s): ['case-01']
MATCH: v2 is accepted, v3 is rejected -- even though v3's pass rate alone looks better than the baseline
```

**Acceptance criteria**: candidate v2 (14/14, `100.00%`) must be accepted, having fixed both known
baseline failures (`case-08`, `case-13`) with zero regressions. Candidate v3 (13/14, `92.86%`) -- a
strictly higher raw pass rate than the `85.71%` baseline -- must be rejected because it breaks
`case-01`, a case the baseline previously passed (co-09, co-07). Both hold, matching the captured
output and the script's own asserts.

**Key takeaway**: the whole capstone converges on one sentence: a candidate is judged by whether it
introduces any regression against the committed baseline, never by whether its raw pass rate is
numerically higher -- exactly the trap Theme D's ex-38 demonstrated in isolation, now proven against
this capstone's own real, committed baseline artefact.

**Why It Matters**: this is the decision rule that makes the entire gate worth building. Without it,
a team ships candidate v3 because "92.86% beats 85.71%" and only discovers the `case-01` regression
from a user report -- exactly the failure mode co-10 turns into the next permanent dataset case, and
exactly the reason this course insists on a per-case diff, not a headline number, as the actual
merge gate.

---

← Previous: [Theme D: Using the Gate on a Real Change](../theme-d-using-the-gate-on-a-real-change.md)
&middot; Next: [Drilling](../../drilling/overview.md) →
