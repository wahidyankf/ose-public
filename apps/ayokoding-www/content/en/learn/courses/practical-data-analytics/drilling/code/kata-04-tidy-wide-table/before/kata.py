# Kata 04 starter: a melt that shifts every month right.
# => Sinar Abadi and its export are fictional; every cell is fixed.
# => TODO: pair each month with its own value; the shift below is the bug.
import csv

with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
months = ["m1", "m2", "m3"]  # => the month columns in order
for row in rows:  # => visit each product once
    for i, month in enumerate(months):  # => walk the months with positions
        value = row[
            months[(i + 1) % 3]
        ]  # => TODO: BUG, shifted one right; use months[i]
        print(row["product"], month, value)  # => prints shifted pairs
