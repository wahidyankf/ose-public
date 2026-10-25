# Kata 02 starter: group means without their counts.
# => Sinar Abadi and its fixture are fictional; every row is fixed.
# => TODO: attach n and flags; bare means rank the loneliest pile first.
import csv
import statistics

with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
piles = {}  # => product to list of quantities
for row in rows:  # => visit each receipt once
    piles.setdefault(row["product"], []).append(int(row["qty"]))  # => file the quantity
for product in sorted(piles):  # => fixed order, every run
    print(
        product, round(statistics.mean(piles[product]), 2)
    )  # => TODO: add n and FLAG-SMALL
