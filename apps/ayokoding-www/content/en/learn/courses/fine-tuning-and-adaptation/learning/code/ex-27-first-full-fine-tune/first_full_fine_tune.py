# learning/code/ex-27-first-full-fine-tune/first_full_fine_tune.py
"""Worked Example 27: First Full Fine-Tune."""  # => co-17: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

# => co-17: `Qwen/Qwen2.5-0.5B-Instruct` is this course's running base model -- Apache 2.0, see this course's References
BASE_MODEL_PARAM_COUNT = 494_000_000  # => co-17: illustrative, order-of-magnitude parameter count for the 0.5B checkpoint (not a vendor-spec figure)
TRAINABLE_PARAM_COUNT_FULL_FINE_TUNE = BASE_MODEL_PARAM_COUNT  # => co-17: a FULL fine-tune updates every single parameter -- 100%

BASELINE_TICKET_VOCAB_PASS_RATE = 0.42  # => co-06: the base model's pass rate on the internal-vocabulary eval, from ex-08's original gap
FULL_FINE_TUNED_TICKET_VOCAB_PASS_RATE = 0.96  # => co-17,co-09: the SAME eval, after a full fine-tune on ex-17's dataset

if __name__ == "__main__":  # => co-17: entry point -- runs only when this file executes directly, not on import
    trainable_fraction = TRAINABLE_PARAM_COUNT_FULL_FINE_TUNE / BASE_MODEL_PARAM_COUNT  # => co-17: what fraction of the model gets updated
    print(f"Trainable parameters: {TRAINABLE_PARAM_COUNT_FULL_FINE_TUNE:,} of {BASE_MODEL_PARAM_COUNT:,} ({trainable_fraction:.0%})")  # => co-17
    print(f"Ticket-vocabulary pass rate: base {BASELINE_TICKET_VOCAB_PASS_RATE:.0%} -> full fine-tune {FULL_FINE_TUNED_TICKET_VOCAB_PASS_RATE:.0%}")  # => co-09,co-17
    lift = FULL_FINE_TUNED_TICKET_VOCAB_PASS_RATE - BASELINE_TICKET_VOCAB_PASS_RATE  # => co-09: the measured improvement this training run bought
    print(f"Lift: +{lift:.0%}")  # => co-09
    assert trainable_fraction == 1.0, "a FULL fine-tune, by definition, trains 100% of the base model's parameters"  # => co-17
    assert lift > 0.4, "the target behaviour must improve substantially after full fine-tuning on ex-08's real gap"  # => co-09
    print("MATCH: every parameter updated, and the target behaviour changed dramatically -- full fine-tuning WORKS on this gap")  # => co-09,co-17
    # => co-09,co-17: it works -- ex-28 prices what "every parameter" actually costs, and ex-29/ex-30 show a cheaper way to get nearly the same result
