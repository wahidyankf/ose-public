# Worked Example 39: A Mini Discounted Cash Flow Valuation
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A DCF values five years of free cash flow plus a terminal value.
# => Growth compounds the flows; the discount rate shrinks them.
from decimal import Decimal

# => Base free cash flow, growth, horizon, and discount rate.
base = Decimal("100000")  # => this year's free cash flow
growth = Decimal("0.03")  # => 3 percent yearly growth
rate = Decimal("0.10")  # => 10 percent discount rate
# => Project five growing flows and discount each to today.
enterprise = Decimal("0")  # => running firm value
flow = base  # => rolled forward one year at a time
for year in range(1, 6):  # => five forecast years
    # => Grow the flow, then discount it back to today.
    flow = flow * (Decimal("1") + growth)  # => next year's cash
    enterprise += flow / ((Decimal("1") + rate) ** year)  # => add its present slice
# => Terminal value: the growing perpetuity starting in year six.
terminal = flow * (Decimal("1") + growth) / (rate - growth)  # => beyond the horizon
enterprise += terminal / ((Decimal("1") + rate) ** 5)  # => discounted terminal
# => One number for the whole firm, before any assumption is questioned.
print("terminal:", terminal.quantize(Decimal("0.01")))  # => Output horizon value
print("enterprise:", enterprise.quantize(Decimal("0.01")))  # => Output firm value
