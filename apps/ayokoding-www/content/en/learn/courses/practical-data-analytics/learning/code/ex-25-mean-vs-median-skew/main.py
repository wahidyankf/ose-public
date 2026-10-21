# Worked Example 25: When the Mean Lies, Skew
# => Sinar Abadi and its orders are fictional; every row is fixed.
# => Nine cafe-size orders plus one catering whopper of 40.
# => Compare the column with and without its biggest row.
import csv
import statistics

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => The full column, whopper included.
qty = [int(row["qty"]) for row in rows]  # => ten observations
# => The same column with its maximum removed.
rest = sorted(qty)[:-1]  # => the nine ordinary orders
# => With the whopper, mean and median part ways.
print("with_whopper mean:", round(statistics.mean(qty), 2))  # => Output reads 6.9
print("with_whopper median:", statistics.median(qty))  # => Output reads 3.0
# => Without it, the two centers nearly agree.
print("without mean:", round(statistics.mean(rest), 2))  # => Output reads 3.22
# => The whopper's pull is the distance between the two means.
print(
    "pull:", round(statistics.mean(qty) - statistics.mean(rest), 2)
)  # => Output reads 3.68
