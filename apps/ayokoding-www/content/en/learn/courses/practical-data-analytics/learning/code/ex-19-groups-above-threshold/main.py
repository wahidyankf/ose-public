# Worked Example 19: Groups Above a Threshold
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Four products total up; only the ones above 6 make the review.
# => Aggregate first, filter groups second: the HAVING order matters.
import csv

# => The review bar, named so the next analyst can move it deliberately.
BAR = 6  # => minimum monthly units to earn discussion

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Total quantities per product in one pass.
totals = {}  # => product to unit total
for row in rows:  # => visit each receipt once
    totals[row["product"]] = totals.get(row["product"], 0) + int(
        row["qty"]
    )  # => add to its pile
# => Keep only the groups that clear the bar, sorted for stability.
winners = sorted([p for p, t in totals.items() if t > BAR])  # => the reviewed products
print("winners:", winners)  # => Output names rice and sugar
# => Two of four products survive the cut.
print("kept:", len(winners), "of", len(totals))  # => Output reads 2 of 4
