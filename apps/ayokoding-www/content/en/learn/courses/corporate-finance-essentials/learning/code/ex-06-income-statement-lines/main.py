# Worked Example 6: A Fictional Income Statement, Line by Line
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The income statement walks from sales down to net income.
# => Each line subtracts one cost family from the line above it.
from decimal import Decimal

# => Sales to resellers for the year, in whole currency units.
revenue = Decimal("1200000")  # => the top line
# => Cost of the goods actually sold this year.
cogs = Decimal("720000")  # => wholesale cost of supplies
# => Gross profit: sales minus the cost of goods sold.
gross = revenue - cogs  # => what trading itself earned
# => Operating costs: warehouse rent, wages, delivery fuel.
opex = Decimal("300000")  # => running the business
# => Earnings before interest and tax, the operating result.
ebit = gross - opex  # => profit before financing and tax
# => Interest on the warehouse loan and the van loan.
interest = Decimal("24000")  # => the lenders' cut
# => Earnings before tax, after financing costs.
ebt = ebit - interest  # => profit the tax rate applies to
# => Corporate tax at a flat fictional 25 percent.
tax = ebt * Decimal("0.25")  # => the government share
# => Net income: the bottom line belonging to owners.
net = ebt - tax  # => what the year added to equity
# => Money prints with two decimals, never float dust.
print("revenue:", revenue)  # => Output repeats the top line
print("gross:", gross)  # => Output shows trading profit
print("ebit:", ebit)  # => Output shows operating profit
print("net:", net)  # => Output shows the bottom line
