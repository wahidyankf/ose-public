# Worked Example 12: Retraction Marks, Never Erases
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Red is asserted, then discontinued two transactions later.
# => The present is empty; the history still shows red.
db = [(1, "part/color", "red", 9001)]  # => the original color fact
# => A retraction names the fact and the transaction that ends it.
retractions = [(1, "part/color", "red", 9003)]  # => red ends at 9003
# => Compute the next value.
gone = [(e, a, v) for e, a, v, _t in retractions]  # => what ended
# => Current facts are asserted ones minus retracted ones.
live = [d for d in db if (d[0], d[1], d[2]) not in gone]  # => red is gone
# => Print the present, then the full ever-asserted history.
print("current-color:", [v for _e, _a, v, _t in live])  # => Output shows no color
# => The check the lesson quotes.
print("history-facts:", len(db))  # => Output shows the red fact survives
# => The check the lesson quotes.
print("retractions:", len(retractions))  # => Output shows one retraction
