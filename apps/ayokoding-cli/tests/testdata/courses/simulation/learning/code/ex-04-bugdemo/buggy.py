"""Elect two leaders on seeds 4 and 31 (fixture for bug-demo simulation)."""

TOTAL = 64
BUG_SEEDS = (4, 31)

failed = list(BUG_SEEDS)
for seed in failed:
    print(f"failing seed: {seed} (one leader per term)")
print(f"seeds: {TOTAL - len(failed)} passed, {len(failed)} failed (of {TOTAL})")
raise SystemExit(1)
