# Worked Example 3: Distributions at a Glance
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => One price carries an extra zero, the classic entry slip.
# => Min, max, and mean sketch each numeric column in three numbers.
import csv
import statistics

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => The two numeric columns get the sketch; the id column is skipped.
for name in ["qty", "price"]:  # => same three numbers per column
    values = [float(row[name]) for row in rows]  # => convert the column
    low = min(values)  # => the floor of the column
    high = max(values)  # => the ceiling, where slips show
    avg = statistics.mean(values)  # => the balancing point
    print(
        name, "min:", int(low), "max:", int(high), "mean:", round(avg, 2)
    )  # => Output sketches it
