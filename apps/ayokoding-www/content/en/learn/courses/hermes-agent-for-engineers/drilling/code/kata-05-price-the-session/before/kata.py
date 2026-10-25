# Kata starter: freeze the session ledger, then compare with after/kata.py.
# => Turns count agent loop iterations, not wall-clock minutes.
turns = 0  # => TODO: count the turns
# => Input and output tokens bill at different rates.
tokens_in = 0  # => TODO: count input tokens
tokens_out = 0  # => TODO: count output tokens
# => Prices are per thousand tokens, matching vendor price pages.
# => Input is cheap and output is dear: keep them separate.
cost = tokens_in / 1000 * 0.003 + tokens_out / 1000 * 0.015  # => session spend
# => Print the spend with four decimals; cents hide drift.
print("session-cost: %.4f" % cost)  # => Output is dollars
