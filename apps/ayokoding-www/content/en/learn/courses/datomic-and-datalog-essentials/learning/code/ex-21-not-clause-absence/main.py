# Worked Example 21: Proving Something Is Missing
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Three named parts, one colored, two answers.
# => Negation subtracts from a bounded universe.
db = [  # => three parts, one color fact
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 10601),  # => colored
    # => Entity 1 part/color.
    (1, "part/color", "red", 10601),  # => the only color
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 10601),  # => uncolored
    # => Entity 3 part/name.
    (3, "part/name", "City basket", 10601),  # => uncolored
    # => Close the collection.
]  # => the universe is every named entity
# => The universe: every entity with a name.
named = {e for e, a, _v, _t in db if a == "part/name"}  # => entities 1, 2, 3
# => Subtract every entity with a color fact.
colored = {e for e, a, _v, _t in db if a == "part/color"}  # => entity 1 only
# => The answer is the difference, printed sorted.
missing = sorted(named - colored)  # => entities 2 and 3
# => The check the lesson quotes.
print("uncolored:", missing)  # => Output shows 2 and 3
