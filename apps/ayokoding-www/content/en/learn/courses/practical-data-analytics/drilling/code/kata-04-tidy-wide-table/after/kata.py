# Kata 04 solution: melt wide to long, each month with its own value.
# => Sinar Abadi and its export are fictional; every cell is fixed.
# => One pair per month column; values ride along untouched.
import csv

# => Open the committed wide fixture that ships with this kata.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Melt: each wide row fans out into one tidy row per month.
months = ["m1", "m2", "m3"]  # => the month columns in order
tidy = 0  # => tidy rows emitted
for row in rows:  # => visit each product once
    for month in months:  # => visit each month column
        print(row["product"], month, row[month])  # => Output prints the true pair
        tidy += 1  # => count the emitted row
print("tidy_rows:", tidy)  # => Output reads 6
