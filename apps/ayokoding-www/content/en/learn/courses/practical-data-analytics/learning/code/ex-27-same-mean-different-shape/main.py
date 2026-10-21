# Worked Example 27: Same Mean, Different Shape
# => Sinar Abadi and its two shelves are fictional; every cell is fixed.
# => Both average 10 a day; one is steady, the other swings wildly.
# => Equal means first, then the spreads that unmask them.
import statistics

# => Shelf A: the steady seller, 9 to 11 every day.
steady = [9, 10, 11, 10, 9, 11, 10]  # => calm all week
# => Shelf B: feast or famine, alternating 2s and 18s around the same mean.
wild = [2, 18, 2, 18, 2, 18, 10]  # => same total, opposite shape
# => The headline number agrees exactly, and misleads exactly.
print(
    "means:", statistics.mean(steady), statistics.mean(wild)
)  # => Output shows 10 and 10
# => Ranges disagree violently: 2 against 16.
print(
    "ranges:", max(steady) - min(steady), max(wild) - min(wild)
)  # => Output shows 2 and 16
# => Standard deviations translate the shapes into felt units.
print(
    "stdevs:",
    round(statistics.stdev(steady), 2),  # => Output reads about 0.82
    round(statistics.stdev(wild), 2),
)  # => Output reads 8.0
