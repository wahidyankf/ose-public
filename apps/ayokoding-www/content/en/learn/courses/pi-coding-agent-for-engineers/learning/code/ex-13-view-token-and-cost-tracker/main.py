# Example 13: View Token and Cost Tracker
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Rates below are illustration constants, not quotes.
# => Replace them with your provider's current price page.
tokens_in = 4200  # => prompt tokens this session spent
# => Output tokens cost more because they are generated.
tokens_out = 1600  # => completion tokens spent
# => Per-thousand rates keep the arithmetic readable.
rate_in = 0.003  # => dollars per thousand input tokens
rate_out = 0.012  # => dollars per thousand output tokens
# => Price each side, then add for the session total.
price = tokens_in / 1000 * rate_in  # => input side cost
price += tokens_out / 1000 * rate_out  # => add output side
# => Budgets turn a number into a decision: over or under.
print("tokens:", tokens_in + tokens_out)  # => Output totals tokens
print("cost-usd:", round(price, 4))  # => Output prices the run
print("within-budget:", price <= 0.05)  # => Output checks the budget
