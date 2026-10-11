"""Example 52: Quantization Quality Cost."""


def synthetic_quality_score(precision_bits: int) -> float:
    # => co-19: illustrative synthetic degradation curve, NOT a published benchmark number -- see this course's References
    baseline = 100.0  # => an arbitrary quality ceiling -- fp16 loses nothing relative to this baseline
    degradation = {16: 0.0, 8: 1.5, 4: 6.0}[precision_bits]  # => illustrative points, not measured data
    return baseline - degradation  # => lower precision, more degradation -- monotonic by construction


def memory_bytes_per_param(precision_bits: int) -> float:  # => co-19: bytes needed to store ONE parameter
    return precision_bits / 8  # => bits divided by 8 -- the direct bits-to-bytes conversion


param_count = 7_000_000_000  # => 7B params, a common "small" open-weights model size, illustrative
results: dict[int, tuple[float, float]] = {}  # => precision (bits) -> (quality score, memory in GiB)
for bits in (16, 8, 4):  # => the three precisions this example compares
    quality = synthetic_quality_score(bits)  # => co-19: quality cost, paid for lower precision
    memory_gb = param_count * memory_bytes_per_param(bits) / (1024**3)  # => co-19: memory bought back
    results[bits] = (quality, round(memory_gb, 2))  # => one row of the tradeoff table per precision
print(results)  # => Output: {16: (100.0, 13.04), 8: (98.5, 6.52), 4: (94.0, 3.26)}

assert results[4][1] < results[8][1] < results[16][1]  # => co-19: memory shrinks monotonically with precision
assert results[4][0] < results[8][0] < results[16][0]  # => co-19: quality degrades monotonically -- the trade is real
# => this synthetic curve motivates the tradeoff shape -- production choices need real eval-suite numbers
print("ex-52 OK")  # => a self-check marker confirming both monotonic trends held across all three precisions
