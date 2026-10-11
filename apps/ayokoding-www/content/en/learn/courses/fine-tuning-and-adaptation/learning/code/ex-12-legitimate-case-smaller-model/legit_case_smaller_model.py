# learning/code/ex-12-legitimate-case-smaller-model/legit_case_smaller_model.py
"""Worked Example 12: Legitimate Case -- Smaller Model."""  # => co-07: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

# => co-27: swapping a large general model for a small ADAPTED model, for latency and cost -- not for capability
LARGE_MODEL_COST_PER_1K_TOKENS_USD = 0.006  # => co-07: illustrative placeholder rate, not a confirmed live-sourced price
SMALL_ADAPTED_MODEL_COST_PER_1K_TOKENS_USD = 0.0004  # => co-07: illustrative placeholder rate (unconfirmed), ~15x cheaper per token
LARGE_MODEL_P50_LATENCY_MS = 1400  # => co-07: illustrative, not a live-sourced figure
SMALL_ADAPTED_MODEL_P50_LATENCY_MS = 180  # => co-07: illustrative -- a small model served locally responds far faster

MONTHLY_TICKET_VOLUME = 40_000  # => co-07: Vantage's actual current triage volume
AVG_TOKENS_PER_TRIAGE_CALL = 900  # => co-07: prompt + completion tokens for one triage call, either model

LARGE_MODEL_EVAL_PASS_RATE = 0.94  # => co-07: the large general model's measured triage accuracy
SMALL_ADAPTED_MODEL_EVAL_PASS_RATE = 0.93  # => co-07: the small model's measured accuracy AFTER adaptation -- nearly matched
MAX_ACCEPTABLE_ACCURACY_DROP = 0.03  # => co-07: how much accuracy Vantage is willing to trade for cost and latency


def monthly_cost(cost_per_1k: float) -> float:  # => co-07: straightforward monthly-cost projection
    """Project this month's triage cost at `cost_per_1k` USD per 1,000 tokens."""  # => co-07: documents monthly_cost's contract -- no runtime output, just sets its __doc__
    total_tokens = MONTHLY_TICKET_VOLUME * AVG_TOKENS_PER_TRIAGE_CALL  # => co-07: total tokens processed this month
    return (total_tokens / 1000) * cost_per_1k  # => co-07: returns this computed value to the caller


if __name__ == "__main__":  # => co-07: entry point -- runs only when this file executes directly, not on import
    large_cost = monthly_cost(LARGE_MODEL_COST_PER_1K_TOKENS_USD)  # => co-07: current monthly spend on the large model
    small_cost = monthly_cost(SMALL_ADAPTED_MODEL_COST_PER_1K_TOKENS_USD)  # => co-07: projected monthly spend on the small adapted model
    print(f"Large model: ${large_cost:,.2f}/mo, p50 {LARGE_MODEL_P50_LATENCY_MS}ms, {LARGE_MODEL_EVAL_PASS_RATE:.0%} accuracy")  # => co-07
    print(f"Small adapted model: ${small_cost:,.2f}/mo, p50 {SMALL_ADAPTED_MODEL_P50_LATENCY_MS}ms, {SMALL_ADAPTED_MODEL_EVAL_PASS_RATE:.0%} accuracy")  # => co-07
    accuracy_drop = LARGE_MODEL_EVAL_PASS_RATE - SMALL_ADAPTED_MODEL_EVAL_PASS_RATE  # => co-07: how much accuracy the swap actually costs
    savings_ratio = 1 - (small_cost / large_cost)  # => co-07: the fraction of cost saved by switching
    print(f"Accuracy drop: {accuracy_drop:.0%} | Cost savings: {savings_ratio:.0%} | Latency improvement: {LARGE_MODEL_P50_LATENCY_MS - SMALL_ADAPTED_MODEL_P50_LATENCY_MS}ms")  # => co-07
    assert accuracy_drop <= MAX_ACCEPTABLE_ACCURACY_DROP, "the accuracy drop must stay within the acceptable budget"  # => co-07
    assert savings_ratio > 0.9, "the small adapted model must deliver a substantial cost saving"  # => co-07
    print("MATCH: the gate passes on economics -- a small adapted model within the accuracy budget, at a large cost and latency win")  # => co-07
    # => co-07,co-27: this is co-07's economics-driven legitimate case -- adaptation used to SHRINK a model, not to teach it something new
