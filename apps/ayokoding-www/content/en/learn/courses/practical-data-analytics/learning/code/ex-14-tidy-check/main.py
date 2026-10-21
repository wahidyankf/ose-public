# Worked Example 14: Checking That Data Is Tidy
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Order 1402 repeats, so the tidy claim must fail loudly.
# => Same columns everywhere, plus a unique declared key.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
    names = list(rows[0].keys())  # => the expected column set
# => Rule one: every row carries exactly the same columns.
same_columns = all(list(row.keys()) == names for row in rows)  # => one shape everywhere
print("same_columns:", same_columns)  # => Output reads True
# => Rule two: the declared key identifies exactly one row.
keys = [row["order_id"] for row in rows]  # => the candidate key column
dupes = sorted({k for k in keys if keys.count(k) > 1})  # => keys appearing twice
print("key_dupes:", dupes)  # => Output names order 1402
# => Tidy only when both rules hold at once.
print("tidy:", same_columns and not dupes)  # => Output reads False
