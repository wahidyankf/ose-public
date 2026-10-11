"""Example 65: Build-vs-Buy Calculation."""


def self_hosted_cost_per_million_tokens(gpu_hourly_rate: float, tokens_per_second: float) -> float:
    # => co-27: gpu_hourly_rate is an illustrative placeholder, not a current market price
    tokens_per_hour = tokens_per_second * 3600  # => converts a per-second rate into an hourly one
    return (gpu_hourly_rate / tokens_per_hour) * 1_000_000  # => cost per million tokens, at FULL utilization


def hosted_api_cost_per_million_tokens(price_per_token: float) -> float:
    # => co-27: price_per_token is an illustrative placeholder, not a current market rate
    return price_per_token * 1_000_000  # => a simple linear scale -- no utilization assumption needed


gpu_hourly_rate = 2.00  # => illustrative placeholder, NOT a current market price
tokens_per_second = 800.0  # => sustained aggregate throughput at a chosen batch size
self_hosted = self_hosted_cost_per_million_tokens(gpu_hourly_rate, tokens_per_second)  # => co-27: the "build" side
hosted_api = hosted_api_cost_per_million_tokens(price_per_token=0.000002)  # => illustrative placeholder rate
print(round(self_hosted, 4), round(hosted_api, 4))  # => Output: 0.6944 2.0

assert self_hosted < hosted_api  # => co-27: at THIS illustrative, FULL utilization, self-hosting is cheaper per token
# => Example 75 revisits this exact comparison under LESS than full utilization -- the answer can flip
print("ex-65 OK")  # => a self-check marker confirming the build-vs-buy comparison held under these assumptions
