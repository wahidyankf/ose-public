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
