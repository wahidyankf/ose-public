# Worked Example 21: Working Capital and the Cash Cycle
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Working capital funds the gap between paying and collecting.
# => The cash cycle counts the days that gap stays open.
from decimal import Decimal

# => Near-term resources and near-term bills.
current_assets = Decimal("450000")  # => cash, receivables, inventory
current_liabilities = Decimal("200000")  # => payables plus short debt
# => Working capital: the buffer funding day-to-day operations.
working = current_assets - current_liabilities  # => the operating cushion
# => The three cycle legs, each as a share of its flow times 365.
inventory_days = Decimal("210000") / Decimal("720000") * Decimal("365")  # => shelf wait
receivables_days = Decimal("150000") / Decimal("1200000") * Decimal("365")  # => collect
payables_days = (
    Decimal("120000") / Decimal("720000") * Decimal("365")
)  # => supplier lag
# => Cash cycle: waits funded by the firm minus the supplier lag.
cycle = inventory_days + receivables_days - payables_days  # => funded days
# => Ninety-plus funded days explain why profit and cash diverged in Example 10.
print("working-capital:", working)  # => Output is the cushion
print("cash-cycle-days:", cycle.quantize(Decimal("0.01")))  # => Output is the gap
