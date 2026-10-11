"""Example 75: TCO Sensitivity to Utilization."""


def tco_per_million_tokens(gpu_hourly_rate: float, tokens_per_second_at_full_load: float, utilization: float) -> float:
    # => co-28: the GPU bills for EVERY hour it's on, but only serves tokens during utilized hours
    effective_tokens_per_hour = tokens_per_second_at_full_load * 3600 * utilization  # => co-28: idle hours produce ZERO tokens
    return (gpu_hourly_rate / effective_tokens_per_hour) * 1_000_000  # => the SAME formula as Example 65, utilization-scaled


gpu_hourly_rate = 2.00  # => illustrative placeholder, NOT a current market price
tokens_per_second_at_full_load = 800.0  # => the SAME peak throughput used in Example 65
hosted_api_cost = 2.00  # => co-27's hosted-API comparison point from Example 65, per million tokens

tco_by_utilization = {u: round(tco_per_million_tokens(gpu_hourly_rate, tokens_per_second_at_full_load, u), 4) for u in (0.9, 0.5, 0.1)}
# => co-28: the SAME hardware, the SAME peak throughput -- only the UTILIZATION assumption changes here
print(tco_by_utilization)  # => Output: {0.9: 0.7716, 0.5: 1.3889, 0.1: 6.9444}

assert tco_by_utilization[0.1] > hosted_api_cost  # => co-28: at LOW utilization, self-hosting is WORSE than the API
assert tco_by_utilization[0.9] < hosted_api_cost  # => co-28: at HIGH utilization, self-hosting is BETTER
# => the whole course closes on this point: infrastructure decisions are workload-shape decisions, not fixed answers
print("ex-75 OK")  # => a self-check marker confirming utilization alone flips the build-vs-buy verdict
