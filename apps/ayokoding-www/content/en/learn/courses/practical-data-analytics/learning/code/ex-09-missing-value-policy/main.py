# Worked Example 9: Choosing a Missing-Value Policy
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => One qty is blank; the policy for it changes the total.
# => Run drop, median-fill, and flag side by side and compare.
import csv
import statistics

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Split the column into known numbers and explicit holes.
known = [int(row["qty"]) for row in rows if row["qty"].strip() != ""]  # => survivors
holes = sum(1 for row in rows if row["qty"].strip() == "")  # => blanks to decide on
# => Policy one: drop every row with a hole, total the survivors.
print("drop_total:", sum(known))  # => Output totals the five known rows
# => Policy two: fill each hole with the median of the survivors.
mid = statistics.median(known)  # => median resists the extremes
print("fill_total:", int(sum(known) + mid * holes))  # => Output adds one median fill
# => Policy three: keep all rows, flag the holes for later.
print("flagged_rows:", len(rows), "flagged:", holes)  # => Output keeps six, flags one
