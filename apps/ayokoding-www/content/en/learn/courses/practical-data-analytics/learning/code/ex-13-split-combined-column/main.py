# Worked Example 13: Splitting a Combined Column
# => Sinar Abadi and its warehouse export are fictional; every cell is fixed.
# => Product and pack arrive glued; one row has no glue at all.
# => Split on the last dash; pack-less rows default to a single unit.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Split each code into its item half and its pack half.
split = []  # => the tidy pairs being built
for row in rows:  # => visit each export row once
    code = row["code"]  # => the glued cell
    if "-" in code:  # => glued rows carry the separator
        item, pack = code.rsplit("-", 1)  # => split on the last dash only
    else:  # => pack-less rows like plain tea
        item, pack = code, "1x"  # => stated default, not a silent guess
    split.append((item, pack, int(row["qty"])))  # => keep qty alongside
# => Show the tidy triples in file order.
for item, pack, qty in split:  # => one observation per row
    print(item, pack, qty)  # => Output prints each split row
# => Distinct items are what an item-level group-by will see.
print("items:", len({item for item, _, _ in split}))  # => Output reads 3
