# Worked Example 2: Column Types and Missing Cells
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => One qty cell is blank on purpose, like a missed keystroke.
# => Scan each column for empties, then probe which read as numbers.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
    names = list(rows[0].keys())  # => keep the column order
# => An empty or whitespace-only cell counts as missing, nowhere else.
missing = {name: 0 for name in names}  # => one counter per column
for row in rows:  # => visit every receipt once
    for name in names:  # => check every column of it
        if row[name].strip() == "":  # => blank means missing
            missing[name] += 1  # => tally the hole
# => A column is numeric only if every filled cell converts to float.
numeric = []  # => names that survive the probe
for name in names:  # => probe each column in order
    try:  # => attempt the conversion
        [
            float(row[name]) for row in rows if row[name].strip() != ""
        ]  # => skip the holes
        numeric.append(name)  # => all filled cells converted
    except ValueError:  # => any text cell fails the probe
        pass  # => the column stays text
# => Report holes first, because they decide the cleaning policy.
print("missing:", missing)  # => Output shows the one blank qty
# => Then report which columns behave as numbers.
print("numeric:", ", ".join(numeric))  # => Output lists the numeric columns
