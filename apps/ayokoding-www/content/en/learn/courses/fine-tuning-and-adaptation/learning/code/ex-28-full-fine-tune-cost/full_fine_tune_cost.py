# learning/code/ex-28-full-fine-tune-cost/full_fine_tune_cost.py
"""Worked Example 28: Full Fine-Tune Cost."""  # => co-17: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

BASE_MODEL_PARAM_COUNT = 494_000_000  # => co-17: same base model as ex-27
BYTES_PER_PARAM_FP32 = 4  # => co-08,co-17: a full fine-tune's optimizer state commonly needs full fp32 precision -- illustrative, library-dependent in reality
OPTIMIZER_STATE_MULTIPLIER = 2  # => co-08,co-17: illustrative -- common optimizers keep roughly 2x the model's own size in additional state (typical, not spec'd)

FULL_FINE_TUNE_WALL_CLOCK_MINUTES = 46.0  # => co-08: measured, illustrative wall-clock time on a small consumer GPU
FULL_FINE_TUNE_GPU_HOUR_COST_USD = 0.80  # => co-08: illustrative placeholder rate, not a confirmed live-sourced price

if __name__ == "__main__":  # => co-17: entry point -- runs only when this file executes directly, not on import
    checkpoint_size_gb = (BASE_MODEL_PARAM_COUNT * BYTES_PER_PARAM_FP32) / (1024**3)  # => co-17: raw model weights alone
    peak_memory_gb = checkpoint_size_gb * (1 + OPTIMIZER_STATE_MULTIPLIER)  # => co-08,co-17: weights PLUS optimizer state, during training
    print(f"Full fine-tune checkpoint size: {checkpoint_size_gb:.2f} GB")  # => co-17: the artefact size -- the WHOLE model, every time
    print(f"Peak training memory (weights + optimizer state): {peak_memory_gb:.2f} GB")  # => co-08: what a training run actually needs to fit in memory
    training_cost_usd = (FULL_FINE_TUNE_WALL_CLOCK_MINUTES / 60) * FULL_FINE_TUNE_GPU_HOUR_COST_USD  # => co-08: wall-clock time, priced
    print(f"Training time: {FULL_FINE_TUNE_WALL_CLOCK_MINUTES:.0f} min | Training cost: ${training_cost_usd:.2f}")  # => co-08
    assert checkpoint_size_gb > 1.5, "a 0.5B-parameter fp32 checkpoint must be well over a gigabyte"  # => co-17
    assert peak_memory_gb > checkpoint_size_gb * 2, "optimizer state must meaningfully exceed the raw checkpoint's own size"  # => co-08,co-17
    print("MATCH: a full fine-tune's checkpoint is the ENTIRE model, and its peak memory footprint is several times that -- this is what ex-30 compares against an adapter")  # => co-08,co-17
    # => co-08,co-17: every one of these numbers is what ex-30 divides by, once ex-29's adapter numbers exist
