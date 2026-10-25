# Worked Example 35: Histogram, Basket Size Shape
# => Sinar Abadi and its baskets are fictional; every cell is fixed.
# => Twelve baskets binned small, medium, large; shape on three lines.
# => Bin edges print with the chart: edges are a judgment call.
import csv

# => The bin edges, stated beside the chart they produce.
BINS = [
    ("small 1-2 ", 1, 2),
    ("medium 3-4", 3, 4),
    ("large 5+  ", 5, 99),
]  # => label, low, high

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Twelve basket quantities in the order they were rung up.
qty = [int(row["qty"]) for row in rows]  # => raw observations
# => Drop each basket into its bin and count the bins.
counts = []  # => one count per bin edge triple
for _, low, high in BINS:  # => visit each bin once
    counts.append(sum(1 for q in qty if low <= q <= high))  # => count its baskets
# => Chart the shape: label, marks, and count per bin.
for (label, _, _), count in zip(BINS, counts):  # => bins in size order
    print(f"{label} {'#' * count} {count}")  # => Output charts each bin
# => Bins must account for every basket observed.
print("baskets:", sum(counts), "of", len(qty))  # => Output reads 12 of 12
