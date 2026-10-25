# Worked Example 15: Reshape Round-Trip Without Loss
# => Sinar Abadi and its monthly table are fictional; every cell is fixed.
# => Melt long, pivot back, and prove every cell survived the trip.
# => The comparison is the reproducibility proof, kept inside the script.
import csv

# => Open the committed wide fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Forward trip: melt the three month columns into pairs.
long = []  # => the long table in transit
for row in rows:  # => visit each wide product row once
    for month in ["m1", "m2", "m3"]:  # => fan out per month column
        long.append((row["product"], month, row[month]))  # => one pair per cell
# => Return trip: pivot the pairs back into wide rows.
back = {}  # => product to month-to-value mapping
for product, month, value in long:  # => visit each melted pair once
    back.setdefault(product, {})[month] = value  # => rebuild the wide row
# => Compare every original cell against its round-tripped twin.
cells = sum(1 for row in rows for m in ["m1", "m2", "m3"])  # => cells that traveled
kept = sum(
    1
    for row in rows  # => cells that match after the trip
    for m in ["m1", "m2", "m3"]
    if back[row["product"]][m] == row[m]
)
print("cells:", cells, "kept:", kept)  # => Output shows 6 and 6
# => Lossless only when every cell matches.
print("lossless:", cells == kept)  # => Output reads True
