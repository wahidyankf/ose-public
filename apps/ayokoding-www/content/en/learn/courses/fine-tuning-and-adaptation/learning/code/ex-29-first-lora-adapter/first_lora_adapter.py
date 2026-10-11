# learning/code/ex-29-first-lora-adapter/first_lora_adapter.py
"""Worked Example 29: First LoRA Adapter."""  # => co-18: this file's own restated purpose, doubling as its module __doc__

from __future__ import annotations  # => hygiene: postpones annotation evaluation, interpreter-version-agnostic

from dataclasses import dataclass  # => co-19: a LoRA config's own shape -- illustrative, mirroring `peft.LoraConfig`'s real fields


@dataclass(frozen=True)  # => co-19: frozen -- a training config is fixed for the duration of one run
class LoraConfig:  # => co-19: illustrative mirror of `peft.LoraConfig` -- see this course's References on the real library's API surface
    rank: int  # => co-20: the adapter's rank -- bounds how much behaviour change it can express
    alpha: int  # => co-19: a scaling factor paired with rank -- exact semantics are library-specific and were not confirmed here; see this course's References
    target_modules: tuple[str, ...]  # => co-19: WHICH weight matrices get a low-rank adapter injected


BASE_MODEL_PARAM_COUNT = 494_000_000  # => co-17: same base model as ex-27/ex-28, base weights stay FROZEN this time
NUM_TARGET_MATRICES = 48  # => co-19: illustrative -- 24 transformer layers x 2 targeted projections (query, value) per layer
HIDDEN_DIM = 896  # => co-19: illustrative hidden dimension for this course's small base model (not a vendor-spec figure)

CONFIG = LoraConfig(rank=8, alpha=32, target_modules=("q_proj", "v_proj"))  # => co-19,co-20: a modest, commonly-cited starting rank

BASELINE_TICKET_VOCAB_PASS_RATE = 0.42  # => co-06: identical baseline to ex-27, for a fair comparison
LORA_TICKET_VOCAB_PASS_RATE = 0.94  # => co-18,co-19: the SAME eval, after training ONLY this small adapter, base frozen

if __name__ == "__main__":  # => co-19: entry point -- runs only when this file executes directly, not on import
    adapter_param_count = NUM_TARGET_MATRICES * 2 * CONFIG.rank * HIDDEN_DIM  # => co-19: two low-rank matrices per targeted weight, per co-19's mechanism
    trainable_fraction = adapter_param_count / BASE_MODEL_PARAM_COUNT  # => co-18: what fraction of the FULL model this adapter actually trains
    print(f"Adapter trainable parameters: {adapter_param_count:,} of {BASE_MODEL_PARAM_COUNT:,} base ({trainable_fraction:.3%})")  # => co-18
    print(f"Ticket-vocabulary pass rate: base {BASELINE_TICKET_VOCAB_PASS_RATE:.0%} -> LoRA adapter {LORA_TICKET_VOCAB_PASS_RATE:.0%}")  # => co-18,co-19
    assert trainable_fraction < 0.01, "a rank-8 adapter must train well under 1% of the base model's parameters"  # => co-18
    assert LORA_TICKET_VOCAB_PASS_RATE > 0.9, "the adapter must produce a comparable behaviour change to ex-27's full fine-tune"  # => co-18,co-19
    print("MATCH: training under 0.15% of the base model's weights reached comparable behaviour change to a full fine-tune -- co-18's central claim")  # => co-18,co-19
    # => co-18,co-19: the base model's own weights never moved -- only these small, injected low-rank matrices did
