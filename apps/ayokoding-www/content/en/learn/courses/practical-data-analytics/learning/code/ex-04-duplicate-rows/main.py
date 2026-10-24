# Worked Example 4: Duplicate Rows
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Order 402 appears twice, the way a double scan looks.
# => Hash each full row; a repeated hash is a duplicate receipt.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Seen fingerprints live here; the first occurrence always survives.
seen = set()  # => hashes of rows already counted
dupes = []  # => order ids reported as doubled
for row in rows:  # => visit every receipt in file order
    key = (row["order_id"], row["product"], row["qty"])  # => full-row fingerprint
    if key in seen:  # => this exact row appeared before
        dupes.append(row["order_id"])  # => report the repeat
    else:  # => first sighting of this row
        seen.add(key)  # => remember it for later rows
# => Report the doubled orders by id.
print("duplicates:", dupes)  # => Output names order 402
# => Unique rows are the file minus its repeats.
print("unique_rows:", len(seen), "of", len(rows))  # => Output shows 5 of 6
