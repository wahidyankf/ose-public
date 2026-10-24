# Worked Example 11: Wide to Long, Melting Quarters
# => Sinar Abadi and its finance export are fictional; every cell is fixed.
# => Two products by four quarters melts into eight tidy rows.
# => One pair per quarter column; values ride along untouched.
import csv

# => Open the committed wide fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Melt: each wide row fans out into one tidy row per quarter.
tidy = []  # => the long table being built
for row in rows:  # => visit each product once
    for quarter in ["q1", "q2", "q3", "q4"]:  # => visit each quarter column
        tidy.append(
            {
                "product": row["product"],
                "quarter": quarter,  # => names become data
                "revenue": int(row[quarter]),
            }
        )  # => values ride along
# => The long table must hold products times quarters rows.
print("tidy_rows:", len(tidy))  # => Output reads 8
# => Spot-check the first melted pair for the first product.
print("rice_q1:", tidy[0]["revenue"])  # => Output reads 120
# => Every melted row carries exactly one observation.
print("columns:", "product,quarter,revenue")  # => Output names the tidy shape
