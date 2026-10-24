# Worked Example 9: Year-over-Year Trend
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A trend divides this year by last year, minus one.
# => Growth rates show direction; levels alone hide it.
from decimal import Decimal

# => Last year and this year revenue, in whole currency units.
prior_revenue = Decimal("1080000")  # => the base year
revenue = Decimal("1200000")  # => the current year
# => Last year and this year net income.
prior_net = Decimal("96000")  # => the base bottom line
net = Decimal("117000")  # => the current bottom line
# => Revenue growth: the change over the base, as a share.
revenue_growth = (revenue - prior_revenue) / prior_revenue  # => top-line momentum
# => Net income growth uses the same formula on the bottom line.
net_growth = (net - prior_net) / prior_net  # => bottom-line momentum
# => Profit grew faster than sales, so margins widened this year.
print("revenue-growth:", (revenue_growth * 100).quantize(Decimal("0.01")))  # => Output
print("net-growth:", (net_growth * 100).quantize(Decimal("0.01")))  # => Output faster
print("margin-widened:", net_growth > revenue_growth)  # => Output states the read
