# Worked Example 20: Receivables Days
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Receivables days convert a balance into collection speed.
# => Slow collection is a quiet loan from the firm to its customers.
from decimal import Decimal

# => Uncollected credit sales and the year's total sales.
receivables = Decimal("150000")  # => cash still with resellers
revenue = Decimal("1200000")  # => the year's sales
# => Days in the year, the fixed conversion constant.
days = Decimal("365")  # => turns a share into days
# => Collection period: the receivables share scaled to days.
collection = receivables / revenue * days  # => how long cash waits
# => About forty-six days: slower than the thirty-day terms allow.
print("receivables:", receivables)  # => Output repeats the balance
print("days:", collection.quantize(Decimal("0.01")))  # => Output is the wait
