# Worked Example 17: Sums and Means per Group
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Eight receipts in three piles; each pile reports total and mean.
# => Keep the raw lists: every aggregate follows from them for free.
import csv
import statistics

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => One value list per product, gathered in a single pass.
piles = {}  # => product to list of quantities
for row in rows:  # => visit each receipt once
    piles.setdefault(row["product"], []).append(int(row["qty"]))  # => file the quantity
# => Total and average each pile from its kept list.
for product in sorted(piles):  # => fixed order, every run
    vals = piles[product]  # => the raw list for this pile
    print(
        product,
        "n:",
        len(vals),
        "sum:",
        sum(vals),  # => Output prints count and total
        "mean:",
        round(statistics.mean(vals), 2),
    )  # => Output prints the average
