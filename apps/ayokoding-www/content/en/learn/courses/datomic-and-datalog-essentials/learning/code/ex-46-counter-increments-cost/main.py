# Worked Example 46: Counters Are the Worst Case
# => Kencana Parts Co. is fictional; every number here is fixed.
# => A thousand increments keep a thousand near-identical datoms.
# => Churn belongs in counters; rollups belong in the log.
db = [
    (1, "part/views", i + 1, 60301 + i) for i in range(1000)
]  # => one thousand increments
# => A row store keeps one cell; a rollup keeps one fact per day.
rollup = [(1, "part/views-daily", 1000, 60401)]  # => the daily rollup fact
# => Print the raw count, the rollup count, and the single cell.
print("counter-datoms:", len(db))  # => Output shows 1000
# => The check the lesson quotes.
print("rollup-datoms:", len(rollup))  # => Output shows 1
# => The check the lesson quotes.
print("mutable-cells:", 1)  # => Output shows 1
