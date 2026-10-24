# Worked Example 18: Interest Coverage
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Interest coverage counts how many times profit pays interest.
# => Lenders watch it because it measures the margin before distress.
from decimal import Decimal

# => Operating profit and the lenders' yearly cut.
ebit = Decimal("180000")  # => profit before interest and tax
interest = Decimal("24000")  # => interest owed for the year
# => Coverage: operating profit per unit of interest.
coverage = ebit / interest  # => the distress margin in one number
# => 7.50 times: profit could fall a long way before interest binds.
print("ebit:", ebit)  # => Output repeats operating profit
print("interest:", interest)  # => Output repeats the lenders' cut
print("coverage:", coverage.quantize(Decimal("0.01")))  # => Output is the margin
