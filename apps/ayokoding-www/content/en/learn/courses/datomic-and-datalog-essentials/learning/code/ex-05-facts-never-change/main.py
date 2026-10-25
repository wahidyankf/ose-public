# Worked Example 5: Facts Are Never Overwritten
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The wheel costs 180 in March, then 175 in April.
# => Both datoms survive: the log only ever grows.
db = [  # => the whole price history is two datoms
    # => Entity 1 part/price.
    (1, "part/price", 180, 4001),  # => the March price
    # => Entity 1 part/price.
    (1, "part/price", 175, 4002),  # => the April correction
    # => Close the collection.
]  # => nothing was updated; a fact was added
# => Filter the price datoms for entity 1, oldest transaction first.
history = sorted(
    (t, v) for e, a, v, t in db if e == 1 and a == "part/price"
)  # => time order
# => Print how many price facts exist, then each one.
print("price-facts:", len(history))  # => Output counts both facts: 2
# => Walk each candidate in turn.
for t, v in history:  # => oldest first, because the log is ordered
    # => The check the lesson quotes.
    print(f"tx={t} price={v}")  # => Output shows March then April
