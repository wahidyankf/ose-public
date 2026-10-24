# Worked Example 39: The Truncated Axis Trick
# => Sinar Abadi and its four months are fictional; every cell is fixed.
# => Same data, two baselines: zero tells calm, 100 screams crisis.
# => Height ratios measure the exaggeration each axis choice creates.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Four months of revenue in millions, in calendar order.
rev = [int(row["revenue"]) for row in rows]  # => 104, 109, 106, 114
# => Drawn heights from a zero baseline: honest proportions.
honest = [v for v in rev]  # => full height counts
print("honest_ratio:", round(max(honest) / min(honest), 2))  # => Output reads about 1.1
# => Drawn heights from a 100 baseline: wobbles become drama.
cut = [v - 100 for v in rev]  # => only the surplus shows
print("truncated_ratio:", round(max(cut) / min(cut), 2))  # => Output reads 3.5
# => The exaggeration factor is the ratio of the two ratios.
print(
    "exaggeration:", round((max(cut) / min(cut)) / (max(honest) / min(honest)), 1)
)  # => Output reads 3.2
