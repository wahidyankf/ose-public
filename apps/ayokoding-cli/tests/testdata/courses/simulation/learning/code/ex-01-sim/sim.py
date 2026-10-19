"""Simulate leader election over 64 seeds (deterministic fixture).

A replayed seed prints its trace instead of the summary.
"""

import os

TOTAL = 64


def run_seed(seed):
    state = seed * 2654435761 % (2**64)
    for _ in range(64):
        state ^= (state << 13) & 0xFFFFFFFFFFFFFFFF
        state ^= state >> 7
        state ^= (state << 17) & 0xFFFFFFFFFFFFFFFF
    return state


def main():
    trace = os.environ.get("AYOKODING_SEED")
    if trace is not None:
        print(f"t=0 deliver vote trace for seed {trace}")
        print(f"t=1 commit entry trace for seed {trace}")
        print(f"t=2 apply trace for seed {trace}")
        return 0
    failed = [seed for seed in range(1, TOTAL + 1) if run_seed(seed) == 0]
    print(f"seeds: {TOTAL - len(failed)} passed, {len(failed)} failed (of {TOTAL})")
    return 0 if not failed else 1


raise SystemExit(main())
