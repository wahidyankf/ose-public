# Kata 01 starter: profile the messy fixture.
# => Sinar Abadi and its fixture are fictional; every row is fixed.
# => TODO: fill the four checks; zeros below are NOT the answer.
import csv

with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => TODO: count blank cells across all columns.
missing = 0  # => TODO: scan every cell like Example 2
# => TODO: count order ids seen more than once.
dupes = 0  # => TODO: fingerprint orders like Example 4
# => TODO: min and max of the price column.
low, high = 0, 0  # => TODO: extremes like Example 3
print("rows:", len(rows))  # => row count works already
print("missing:", missing)  # => prints the wrong zero
print("dupes:", dupes)  # => prints the wrong zero
print("price:", low, high)  # => prints the wrong zeros
