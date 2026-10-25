# Kata starter: price the session from its token counts.
# => Rates below are illustration constants, not quotes.
tokens_in = 18400  # => prompt tokens spent
tokens_out = 6200  # => completion tokens spent
# => TODO: set per-thousand rates and a budget below.
rate_in = 0.0  # => TODO: dollars per thousand input
rate_out = 0.0  # => TODO: dollars per thousand output
# => Zero rates price nothing: fill them before judging.
# => Print the token total so the spend has a base.
print("tokens:", tokens_in + tokens_out)  # => Output totals
