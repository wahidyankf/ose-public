# Worked Example 18: Grouping by Two Keys
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Twelve receipts become dated piles keyed by product and month.
# => Tuple keys carry any number of dimensions through one loop.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Pile quantities under (product, month) pairs cut from the date.
piles = {}  # => pair to list of quantities
for row in rows:  # => visit each receipt once
    month = row["date"][:7]  # => ISO prefix YYYY-MM is the month
    key = (row["product"], month)  # => the two-dimensional pile label
    piles.setdefault(key, []).append(int(row["qty"]))  # => file the quantity
# => Report each dated pile with its count and total, sorted for stability.
for product, month in sorted(piles):  # => fixed order, every run
    vals = piles[(product, month)]  # => the raw list for this pile
    print(
        product, month, "n:", len(vals), "sum:", sum(vals)
    )  # => Output prints the pile
# => Eight piles from twelve rows: two keys multiply the groups fast.
print("piles:", len(piles))  # => Output reads 8
# => Spot-check the pile the sales review will quote first.
print("rice_2026-09_sum:", sum(piles[("rice-5kg", "2026-09")]))  # => Output reads 5
