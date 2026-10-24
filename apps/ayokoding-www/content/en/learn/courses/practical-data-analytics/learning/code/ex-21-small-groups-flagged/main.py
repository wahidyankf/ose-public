# Worked Example 21: Flagging Small Groups
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Oil looks best on average, from a single lonely receipt.
# => Attach n to every mean; flag piles below the stated floor.
import csv
import statistics

# => The smallest pile trusted without a warning, stated not hidden.
FLOOR = 3  # => groups below this get flagged

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => One value list per product, gathered in a single pass.
piles = {}  # => product to list of quantities
for row in rows:  # => visit each receipt once
    piles.setdefault(row["product"], []).append(int(row["qty"]))  # => file the quantity
# => Report each pile with its size, its mean, and its trust flag.
trusted = 0  # => piles clearing the floor
for product in sorted(piles):  # => fixed order, every run
    vals = piles[product]  # => the raw list for this pile
    ok = len(vals) >= FLOOR  # => big enough to trust quietly
    trusted += 1 if ok else 0  # => count the survivors
    print(
        product,
        "n:",
        len(vals),
        "mean:",
        round(statistics.mean(vals), 2),  # => Output prints the pile
        "ok:" if ok else "FLAG-SMALL",
    )  # => Output marks the doubtful
# => Two of three piles earn unflagged trust.
print("trusted:", trusted, "of", len(piles))  # => Output reads 2 of 3
