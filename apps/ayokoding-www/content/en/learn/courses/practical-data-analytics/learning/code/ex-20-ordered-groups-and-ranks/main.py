# Worked Example 20: Ordering Groups and Ranking Them
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Four products total 19 units; the ranking prints best first.
# => Sort the aggregates descending, then number them from one.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Total quantities per product in one pass.
totals = {}  # => product to unit total
for row in rows:  # => visit each receipt once
    totals[row["product"]] = totals.get(row["product"], 0) + int(
        row["qty"]
    )  # => add to its pile
# => Order the products by total, biggest first; ties break alphabetically.
ranked = sorted(
    totals.items(), key=lambda kv: (-kv[1], kv[0])
)  # => deterministic order
# => Number the ranks starting at one, the way the slide will show them.
for rank, (product, total) in enumerate(ranked, start=1):  # => walk best to worst
    print("rank", rank, product, total)  # => Output prints each ranked line
# => The ranks must account for every unit sold.
print("units:", sum(totals.values()))  # => Output reads 22
