# Kata 02 solution: group means with n attached and small piles flagged.
# => Sinar Abadi and its fixture are fictional; every row is fixed.
# => The Example 21 habit: no mean travels without its pile size.
import csv
import statistics

# => The smallest pile trusted without a warning, stated not hidden.
FLOOR = 3  # => groups below this get flagged

# => Open the committed fixture that ships with this kata.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => One value list per product, gathered in a single pass.
piles = {}  # => product to list of quantities
for row in rows:  # => visit each receipt once
    piles.setdefault(row["product"], []).append(int(row["qty"]))  # => file the quantity
# => Report each pile with its size, mean, and trust flag.
for product in sorted(piles):  # => fixed order, every run
    vals = piles[product]  # => the raw list for this pile
    flag = "ok" if len(vals) >= FLOOR else "FLAG-SMALL"  # => the stated floor decides
    print(
        product,
        "n:",
        len(vals),
        "mean:",  # => Output prints size and center
        round(statistics.mean(vals), 2),
        flag,
    )  # => Output prints the flag
