# learning/code/ex-30-record-tokens-and-cost/tokens_and_cost.py
"""Worked Example 30: Record Tokens and Cost."""  # => co-11: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

CASES = {  # => co-11: case id -> (prompt text, output text) -- what actually got sent and returned
    "case-01": ("How much free storage does Nimbus give?", "New Nimbus accounts start with 15 GB of free storage."),  # => co-11: case 1
    "case-02": ("How much storage does Nimbus Pro include?", "Nimbus Pro includes 200 GB of storage."),  # => co-11: case 2
}  # => co-11: closes CASES
PRICE_PER_TOKEN = 0.000002  # => co-11: placeholder rate, not a confirmed market rate -- read the real one from config, never hard-code it in production


def estimate_tokens(text: str) -> int:  # => co-11: a mocked, offline token estimate -- no real tokenizer call needed
    """Approximate token count as roughly 1.3 tokens per whitespace-separated word."""  # => co-11: documents estimate_tokens's contract -- no runtime output, just sets its __doc__
    word_count = len(text.split())  # => co-11: a simple, deterministic proxy for a real tokenizer
    return round(word_count * 1.3)  # => co-11: rounds to a whole token count


def cost_for_case(prompt: str, output: str) -> tuple[int, float]:  # => co-11: tokens AND their dollar cost, together
    """Return (total_tokens, cost_usd) for one case's prompt + output."""  # => co-11: documents cost_for_case's contract -- no runtime output, just sets its __doc__
    total_tokens = estimate_tokens(prompt) + estimate_tokens(output)  # => co-11: prompt tokens plus completion tokens
    cost_usd = total_tokens * PRICE_PER_TOKEN  # => co-11: tokens times the per-token rate
    return total_tokens, cost_usd  # => co-11: returns this computed value to the caller


if __name__ == "__main__":  # => co-11: entry point -- runs only when this file executes directly, not on import
    total_tokens_all = 0  # => co-11: accumulates tokens across every case in this run
    total_cost_all = 0.0  # => co-11: accumulates cost across every case in this run
    for case_id, (prompt, output) in CASES.items():  # => co-11: one estimate per case, alongside its own pass/fail
        tokens, cost = cost_for_case(prompt, output)  # => co-11: this case's own tokens and cost
        total_tokens_all += tokens  # => co-11: running total across the whole run
        total_cost_all += cost  # => co-11: running total across the whole run
        print(f"{case_id}: {tokens} tokens, ${cost:.6f}")  # => co-11: prints this case's own tokens and cost
    print(f"Run totals: {total_tokens_all} tokens, ${total_cost_all:.6f}")  # => co-11: prints the whole run's totals
    assert total_tokens_all > 0, "a non-empty run must report a positive token total"  # => co-11: sanity check
    assert total_cost_all > 0.0, "a non-empty run must report a positive cost total"  # => co-11: sanity check
    print("MATCH: every case's tokens and cost are recorded in the SAME run as its pass/fail verdict")  # => co-11
    # => co-11: a quality win that costs 4x more per case is a decision to make deliberately, not something to discover in a bill
