# Worked Example 12: Long to Wide, Pivoting for People
# => Sinar Abadi and its monthly rows are fictional; every cell is fixed.
# => Six tidy rows pivot into two presentation rows of three months.
# => Collect months per product, then lay them out as columns.
import csv

# => Open the committed long fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Gather each product's months into one dict of dicts.
grid = {}  # => product to month-to-revenue mapping
for row in rows:  # => visit each tidy observation once
    grid.setdefault(row["product"], {})[row["month"]] = int(
        row["revenue"]
    )  # => file by keys
# => Lay the grid out wide: one row per product, months across.
for product in sorted(grid):  # => alphabetical for a stable slide
    print(
        product, grid[product]["1"], grid[product]["2"], grid[product]["3"]
    )  # => Output prints the row
# => Width check: two products survived the pivot.
print("wide_rows:", len(grid))  # => Output reads 2
# => Spot-check the cell the review slide will quote.
print("sugar_m2:", grid["sugar-1kg"]["2"])  # => Output reads 95
