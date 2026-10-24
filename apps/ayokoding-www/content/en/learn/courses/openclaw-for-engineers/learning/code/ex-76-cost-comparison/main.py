# => Tokens plus review minutes per leg.
# => Review labour can flip the verdict.
RATE = 100  # => tokens priced at 100 per review minute
# => RATE converts minutes to token-equivalents
legs = {"openclaw": (8400, 10), "sibling": (5000, 60)}  # => tokens plus review minutes per leg
# => sibling ran cheap but reviews heavy
totals = {}  # => totals collects the true cost per tool
for tool, (tokens, minutes) in legs.items():  # => total each leg the same way
    true_cost = tokens + RATE * minutes  # => tokens plus priced review labour
    # => openclaw 9400, sibling 11000
    totals[tool] = true_cost  # => record this leg's true cost
    # => totals gains both tools
    print("%s: tokens=%d review=%dmin true=%d" % (tool, tokens, minutes, true_cost))  # => Output: two true-cost lines
cheapest = min(totals, key=totals.get)  # => lowest true cost wins
# => cheapest is openclaw
print("cheapest to own: " + cheapest)  # => Output: cheapest to own: openclaw
