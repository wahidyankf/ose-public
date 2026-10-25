# Worked Example 23: Spread, Range, Variance, Deviation
# => Sinar Abadi and its daily sales are fictional; every cell is fixed.
# => Both shelves average 5 a day; their consistency could not differ more.
# => Range, variance, and standard deviation measure the wobble.
import csv
import statistics

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Daily sales per product, kept as raw lists.
rice = [int(row["rice"]) for row in rows]  # => the steady shelf
sugar = [int(row["sugar"]) for row in rows]  # => the swinging shelf
# => Same center first, so the spread contrast lands cleanly.
print(
    "rice mean:", statistics.mean(rice), "sugar mean:", statistics.mean(sugar)
)  # => Output shows 5 and 5
# => Range is the cheapest spread: max minus min.
print(
    "rice range:", max(rice) - min(rice), "sugar range:", max(sugar) - min(sugar)
)  # => Output shows 2 and 6
# => Standard deviation translates variance into felt units.
print("rice stdev:", round(statistics.stdev(rice), 2))  # => Output reads about 1.0
print("sugar stdev:", round(statistics.stdev(sugar), 2))  # => Output reads 3.0
