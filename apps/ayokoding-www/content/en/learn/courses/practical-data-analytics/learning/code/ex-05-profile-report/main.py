# Worked Example 5: A Profile Report in Ten Lines
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => The fixture mixes every wart: a blank, a double, a wide range.
# => Combine the four moves into one labeled plain-text report.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
    names = list(rows[0].keys())  # => keep the column order
# => Missing cells: blank strings in any column.
holes = sum(
    1 for row in rows for name in names if row[name].strip() == ""
)  # => count every blank
# => Duplicates: full-row fingerprints seen more than once.
keys = [
    (row["order_id"], row["product"], row["qty"]) for row in rows
]  # => one tuple per row
dupes = len(keys) - len(set(keys))  # => repeats beyond first sightings
# => Numeric range over the price column, skipping its blanks.
prices = [
    float(row["price"]) for row in rows if row["price"].strip() != ""
]  # => filled cells only
# => Print the six-line handoff the next analyst will read first.
print("rows:", len(rows))  # => Output counts the receipts
print("columns:", ", ".join(names))  # => Output names the fields
print("missing_cells:", holes)  # => Output totals the blanks
print("duplicate_rows:", dupes)  # => Output totals the repeats
print("price_min:", int(min(prices)))  # => Output floors the column
print("price_max:", int(max(prices)))  # => Output ceilings it
