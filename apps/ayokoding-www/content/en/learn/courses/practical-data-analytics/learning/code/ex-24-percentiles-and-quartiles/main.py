# Worked Example 24: Percentiles and Quartiles
# => Sinar Abadi and its receipt totals are fictional; every cell is fixed.
# => Fifteen receipts ranked; quartiles frame the typical one.
# => Quantiles cut the sorted list; the middle half is the story.
import statistics

# => Fifteen receipt totals, fixed in the script for a focused lesson.
totals = [
    22000,
    35000,
    39000,
    42000,
    48000,
    52000,
    58500,
    58500,  # => the lower half
    62000,
    70000,
    75000,
    96000,
    117000,
    140000,
    175500,
]  # => the upper tail
# => Quartiles cut the sorted week into quarters.
qs = statistics.quantiles(totals, n=4)  # => the 25th, 50th, 75th marks
print(
    "q1:", int(qs[0]), "median:", int(qs[1]), "q3:", int(qs[2])
)  # => Output frames the typical
# => The interquartile range is the width of the middle half.
print("iqr:", int(qs[2] - qs[0]))  # => Output reads 36500
# => Fifteen receipts means eleven fall at or below the third quartile.
below = sum(1 for t in totals if t <= qs[2])  # => count the covered receipts
print("covered:", below, "of", len(totals))  # => Output reads 11 of 15
