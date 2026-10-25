# Worked Example 34: Bar Chart, Top Products by Revenue
# => Sinar Abadi and its receipts are fictional; every row is fixed.
# => Revenue per product drawn as bars of hash marks, longest first.
# => One mark per 25,000 keeps the encoding fixed and honest.
import csv

# => Revenue in rupiah per hash mark on the chart.
UNIT = 25000  # => the fixed scale of the encoding

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Revenue per product: quantity times unit price, summed.
revenue = {}  # => product to revenue total
for row in rows:  # => visit each receipt once
    revenue[row["product"]] = revenue.get(row["product"], 0)  # => keep the pile
    revenue[row["product"]] += int(row["qty"]) * int(
        row["price"]
    )  # => price this receipt
# => Draw best first: length now carries the ranking.
for product, total in sorted(revenue.items(), key=lambda kv: -kv[1]):  # => descending
    bars = "#" * (total // UNIT)  # => fixed scale to marks
    print(f"{product:10} {bars} {total}")  # => Output prints each bar and number
