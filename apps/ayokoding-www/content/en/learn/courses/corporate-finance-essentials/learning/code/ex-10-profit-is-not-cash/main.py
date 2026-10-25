# Worked Example 10: Profit Is Not Cash
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Net income counts promises; operating cash counts collections.
# => Working-capital moves explain the gap between the two.
from decimal import Decimal

# => The bottom line from the income statement walk.
net = Decimal("117000")  # => profit on paper
# => Depreciation: a real cost already paid, with no cash leaving now.
depreciation = Decimal("60000")  # => added back, not spent again
# => Receivables grew: sales booked but not yet collected.
receivables_up = Decimal("30000")  # => cash still with resellers
# => Inventory grew: cash converted into shelf stock.
inventory_up = Decimal("40000")  # => cash sitting in the warehouse
# => Payables grew: supplier cash kept a little longer.
payables_up = Decimal("20000")  # => cash not yet paid out
# => Operating cash flow: profit adjusted for non-cash and timing.
ocf = net + depreciation - receivables_up - inventory_up + payables_up  # => cash truth
# => The two numbers differ, and the adjustments name exactly why.
print("net:", net)  # => Output repeats accounting profit
print("ocf:", ocf)  # => Output shows cash generated
print("gap:", (net - ocf))  # => Output sizes the timing difference
