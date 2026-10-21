# Worked Example 1: Shape and Size First
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Orientation comes before statistics: count rows, columns, names.
# => The csv module reads the header and tallies rows with no extras.
import csv

# => Open the committed fixture that ships with this example.
path = "data.csv"  # => the file lives beside this script
# => Read every row into a list so it can be counted twice.
with open(path, newline="", encoding="utf-8") as handle:  # => text mode, fixed encoding
    rows = list(csv.DictReader(handle))  # => first line becomes the keys
# => The header names are the dataset's only built-in documentation.
print("columns:", ", ".join(rows[0].keys()))  # => Output names the five columns
# => Row count tells whether statistics are even worth computing.
print("rows:", len(rows))  # => Output counts the twelve receipts
# => Column count frames every cleaning decision that follows.
print("n_columns:", len(rows[0]))  # => Output counts the five fields
