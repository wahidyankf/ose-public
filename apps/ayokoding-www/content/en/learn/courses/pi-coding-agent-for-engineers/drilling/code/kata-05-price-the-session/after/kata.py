# Kata 5: Price the Session
# => Tokens times rates is the real price of the task.
# => Per-thousand rates keep the arithmetic readable.
# => Budgets turn a number into a decision: over or under.
tokens_in = 18400  # => prompt tokens this session spent
# => Output tokens cost more because they are generated.
tokens_out = 6200  # => completion tokens spent
# => Illustration rates stand in for the price page.
rate_in = 0.003  # => dollars per thousand input tokens
rate_out = 0.012  # => dollars per thousand output tokens
# => Price each side, then add for the session total.
price = tokens_in / 1000 * rate_in  # => input side cost
price += tokens_out / 1000 * rate_out  # => add output side
# => Print tokens, price, and the budget verdict.
print("tokens:", tokens_in + tokens_out)  # => Output totals
print("cost-usd:", round(price, 4))  # => Output prices the run
# => The verdict below is information, not judgement.
print("within-budget:", price <= 0.15)  # => Output checks budget
