# Worked Example 16: Counting Rows per Group
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Ten receipts split into piles by product, each pile counted.
# => A plain dict is the whole engine: split, count, recombine.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => One counter per product, built by visiting every receipt once.
counts = {}  # => product to receipt count
for row in rows:  # => split the rows into piles
    counts[row["product"]] = counts.get(row["product"], 0) + 1  # => count this pile
# => Report the piles alphabetically for a stable reading order.
for product in sorted(counts):  # => fixed order, every run
    print(product, counts[product])  # => Output prints each pile size
# => Groups must sum back to the input: the checksum habit starts here.
print("total:", sum(counts.values()), "of", len(rows))  # => Output shows 10 of 10
