# Kata 01 solution: profile the messy fixture, four checks filled.
# => Sinar Abadi and its fixture are fictional; every row is fixed.
# => Shape plus holes, doubles, and extremes: the Example 5 handoff.
import csv

# => Open the committed fixture that ships with this kata.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
    names = list(rows[0].keys())  # => keep the column order
# => Blank cells anywhere in the file.
missing = sum(1 for r in rows for n in names if r[n].strip() == "")  # => the one hole
# => Order ids appearing more than once.
ids = [r["order_id"] for r in rows]  # => the candidate key
dupes = len(ids) - len(set(ids))  # => repeats beyond first sightings
# => Price extremes over the filled cells.
prices = [float(r["price"]) for r in rows if r["price"].strip() != ""]  # => survivors
print("rows:", len(rows))  # => Output counts the six receipts
print("missing:", missing)  # => Output reads 1
print("dupes:", dupes)  # => Output reads 1
print("price:", int(min(prices)), int(max(prices)))  # => Output shows 17500 480000
