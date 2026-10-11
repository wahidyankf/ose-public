# learning/capstone/decision/decision.py
"""Capstone Step 1: The Decision (exercises co-01, co-03, co-04, co-05, co-06, co-08, co-30, co-31)."""  # => co-06: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

import json  # => co-06: the decision record this step commits is a plain JSON artefact, read by every later step
from pathlib import Path  # => co-06: locates this step's own committed artefact, relative to this file
from typing import TypedDict  # => co-06: types the committed decision-record artefact, so no field is ever untyped downstream

RESULT_PATH = Path(__file__).parent / "decision_record.json"  # => co-06: this step's own committed artefact -- dataset/dataset.py reads it next

BASE_MODEL_ID = "qwen2.5-0.5b-instruct-r1"  # => co-30: pinned base -- every later step's own pin traces back to this one constant
TARGET_PASS_RATE_FLOOR = 0.85  # => co-06: the eval bar every alternative must clear to count as "closed the gap"

BASE_PASS_RATE = 0.60  # => co-06: the real, measured starting gap on Vantage's ticket-triage task (matches this course's own ex-01)
PROMPTED_PASS_RATE = 0.71  # => co-03: genuinely improved with better instructions and few-shot examples, still short of the floor
RETRIEVAL_PASS_RATE = 0.62  # => co-04: barely moves the needle -- confirms the gap is behaviour-shaped, not knowledge-shaped
SCOPED_PASS_RATE = 0.74  # => co-05: narrowing the task genuinely helps, still short of the floor


class DecisionRecord(TypedDict):  # => co-06: the committed shape every later capstone step reads
    decision: str  # => co-06: "go" or "no-go"
    base_pass_rate: float  # => co-06: the measured starting gap
    prompted_pass_rate: float  # => co-03: prompting's own measured result
    retrieval_pass_rate: float  # => co-04: retrieval's own measured result
    scoped_pass_rate: float  # => co-05: scoping's own measured result
    behaviour_shaped: bool  # => co-01: is this gap about behaviour, not facts
    licence_ok: bool  # => co-31: base-model licence and data rights, cleared before training
    base_model_id: str  # => co-30: the pinned base every later step must match
    total_one_time_cost_usd: float  # => co-08: data labour + compute + eval, excluding the recurring maintenance line
    monthly_maintenance_cost_usd: float  # => co-08,co-30: the STANDING obligation, not a one-time cost


if __name__ == "__main__":  # => co-06: entry point -- runs only when this file executes directly, not on import
    print(f"Base pass rate on Vantage's ticket-triage task: {BASE_PASS_RATE:.0%} (target floor: {TARGET_PASS_RATE_FLOOR:.0%})")  # => co-06
    print(f"Prompting attempt: {PROMPTED_PASS_RATE:.0%} | Retrieval attempt: {RETRIEVAL_PASS_RATE:.0%} | Scoping attempt: {SCOPED_PASS_RATE:.0%}")  # => co-03,co-04,co-05
    alternatives_exhausted = all(rate < TARGET_PASS_RATE_FLOOR for rate in (PROMPTED_PASS_RATE, RETRIEVAL_PASS_RATE, SCOPED_PASS_RATE))  # => co-03,co-04,co-05: every alternative genuinely measured and still short
    assert alternatives_exhausted, "every alternative must be genuinely measured and still fall short of the target floor before adaptation is even a candidate"  # => co-06
    behaviour_shaped = True  # => co-01: ticket triage is a format/behaviour task, not a missing-facts task -- confirmed by retrieval's own weak result above
    assert behaviour_shaped and RETRIEVAL_PASS_RATE - BASE_PASS_RATE < 0.05, "a genuinely behaviour-shaped gap must show retrieval moving the needle by only a few points, not closing it"  # => co-01,co-04
    licence_ok = True  # => co-31: qwen2.5-0.5b-instruct-r1 is Apache 2.0 licensed, checked against its model card -- see this course's References
    data_labour_usd, compute_usd, eval_usd = 1_200.00, 45.00, 150.00  # => co-08: the one-time cost lines this project actually budgeted
    total_one_time_cost_usd = data_labour_usd + compute_usd + eval_usd  # => co-08: the naive compute-only estimate would have missed the first and third of these
    monthly_maintenance_cost_usd = 650.00  # => co-08,co-30: matches this course's own retiring-adapter maintenance figure -- a recurring, not one-time, cost
    decision = "go" if (alternatives_exhausted and behaviour_shaped and licence_ok) else "no-go"  # => co-06: the ordered gate's own final verdict
    print(f"Total one-time cost: ${total_one_time_cost_usd:,.2f} | Monthly maintenance: ${monthly_maintenance_cost_usd:,.2f} | Licence OK: {licence_ok}")  # => co-08,co-31
    print(f"Decision: {decision}")  # => co-06
    assert decision == "go", "this capstone's own scenario is designed so a correctly evidenced gate reaches go, not no-go"  # => co-06
    record: DecisionRecord = {  # => co-06: the full committed artefact -- every field traceable to a measurement made above
        "decision": decision,  # => co-06
        "base_pass_rate": BASE_PASS_RATE,  # => co-06
        "prompted_pass_rate": PROMPTED_PASS_RATE,  # => co-03
        "retrieval_pass_rate": RETRIEVAL_PASS_RATE,  # => co-04
        "scoped_pass_rate": SCOPED_PASS_RATE,  # => co-05
        "behaviour_shaped": behaviour_shaped,  # => co-01
        "licence_ok": licence_ok,  # => co-31
        "base_model_id": BASE_MODEL_ID,  # => co-30
        "total_one_time_cost_usd": total_one_time_cost_usd,  # => co-08
        "monthly_maintenance_cost_usd": monthly_maintenance_cost_usd,  # => co-08,co-30
    }  # => co-06: closes record
    RESULT_PATH.write_text(json.dumps(record, indent=2, sort_keys=True) + "\n", encoding="utf-8")  # => co-06: commits the artefact dataset/dataset.py reads next
    print(f"MATCH: decision record committed to {RESULT_PATH.name} -- every alternative measured, the gate says go, and the licence clears before any training begins")  # => co-06,co-31
    # => co-06: a documented no-go would have been an equally valid, passing capstone outcome -- this scenario is built to reach go so the remaining four steps have something to build
