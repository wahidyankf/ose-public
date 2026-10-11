# learning/code/ex-33-learning-rate-and-epochs/lr_and_epochs.py
"""Worked Example 33: Learning Rate and Epochs."""  # => co-24: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from typing import NamedTuple  # => co-24: one row per swept hyperparameter combination


class SweepResult(NamedTuple):  # => co-24: (learning_rate, epochs, eval_pass_rate) -- the two hyperparameters co-24 says matter most
    learning_rate: float  # => co-24: the training step size
    epochs: int  # => co-24: how many passes over the dataset
    eval_pass_rate: float  # => co-24: the resulting model's measured pass rate on ex-08's fixed eval


# => co-24: five combinations, all trained on the SAME dataset from ex-17/ex-29 -- only lr and epochs vary
SWEEP: list[SweepResult] = [  # => co-24: one row per combo, own comment per row
    SweepResult(learning_rate=1e-5, epochs=1, eval_pass_rate=0.71),  # => co-24: too low a rate, too few epochs -- undertrained
    SweepResult(learning_rate=1e-5, epochs=3, eval_pass_rate=0.85),  # => co-24: more epochs helps, still short of the good region
    SweepResult(learning_rate=2e-4, epochs=3, eval_pass_rate=0.94),  # => co-24: the region ex-29 actually used -- the best result in this sweep
    SweepResult(learning_rate=2e-4, epochs=10, eval_pass_rate=0.93),  # => co-24: too many epochs at a good rate -- a slight dip, an early overfitting signal
    SweepResult(learning_rate=5e-3, epochs=3, eval_pass_rate=0.40),  # => co-24: rate far too high -- training genuinely diverged
]  # => co-24: closes SWEEP

BATCH_SIZE_VARIANTS_PASS_RATE_RANGE = (0.935, 0.945)  # => co-24: illustrative -- batch size 8/16/32 barely moved the result at all, held elsewhere constant (not a published benchmark)


if __name__ == "__main__":  # => co-24: entry point -- runs only when this file executes directly, not on import
    for row in SWEEP:  # => co-24: print the whole (lr, epochs) sweep
        print(f"  lr={row.learning_rate:.0e}, epochs={row.epochs}: {row.eval_pass_rate:.0%} pass rate")  # => co-24
    best_result = max(SWEEP, key=lambda r: r.eval_pass_rate)  # => co-24: which combination actually won
    worst_result = min(SWEEP, key=lambda r: r.eval_pass_rate)  # => co-24: which combination diverged worst
    print(f"Best: lr={best_result.learning_rate:.0e}, epochs={best_result.epochs} -> {best_result.eval_pass_rate:.0%}")  # => co-24
    print(f"Worst: lr={worst_result.learning_rate:.0e}, epochs={worst_result.epochs} -> {worst_result.eval_pass_rate:.0%}")  # => co-24
    hyperparameter_swing = best_result.eval_pass_rate - worst_result.eval_pass_rate  # => co-24: how much lr/epochs alone can swing the result
    batch_size_swing = BATCH_SIZE_VARIANTS_PASS_RATE_RANGE[1] - BATCH_SIZE_VARIANTS_PASS_RATE_RANGE[0]  # => co-24: how much batch size alone swings it
    print(f"lr/epochs swing: {hyperparameter_swing:.0%} vs. batch-size swing: {batch_size_swing:.0%}")  # => co-24
    assert hyperparameter_swing > batch_size_swing * 5, "learning rate and epochs must swing the result far more than a comparatively minor knob like batch size"  # => co-24
    print("MATCH: learning rate and epoch count dominate this result -- most other knobs are noise by comparison, per co-24")  # => co-24
    # => co-24: this is why ex-34 asks the harder question -- can ANY hyperparameter sweep fix a dataset problem instead?
