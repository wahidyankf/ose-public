# Worked Example 10: Deduplicating and Choosing the Survivor
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Order 1002 was corrected by re-export; the newer stamp wins.
# => Group by order id and keep the row with the latest stamp.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => One survivor slot per order id, filled by newest stamp.
best = {}  # => order id to winning row
for row in rows:  # => visit every export row once
    key = row["order_id"]  # => the identity being deduplicated
    if key not in best or row["updated"] > best[key]["updated"]:  # => newer stamp wins
        best[key] = row  # => install the current survivor
# => Show the survivor chosen for the doubled order.
print("survivor_1002_qty:", best["1002"]["qty"])  # => Output reads the corrected 4
print("survivor_1002_stamp:", best["1002"]["updated"])  # => Output reads 2026-09-03
# => Unique orders are what Theme D will aggregate.
print("unique_orders:", len(best))  # => Output reads 3
