# Worked Example 20: Either Clause Can Match
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Two branches, three matches, one deduplicated answer.
# => Union keeps an entity when any branch matches.
db = [  # => four parts with names and prices
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 10501),  # => matches by name
    # => Entity 1 part/price.
    (1, "part/price", 180, 10501),  # => too pricey for branch two
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 10501),  # => no name match
    # => Entity 2 part/price.
    (2, "part/price", 25, 10501),  # => matches by price
    # => Entity 3 part/name.
    (3, "part/name", "City basket", 10501),  # => no name match
    # => Entity 3 part/price.
    (3, "part/price", 45, 10501),  # => matches by price
    # => Entity 4 part/name.
    (4, "part/name", "E-bike motor", 10501),  # => no name match
    # => Entity 4 part/price.
    (4, "part/price", 320, 10501),  # => no price match either
    # => Close the collection.
]  # => eight facts, three winners
# => Branch one: names starting with Road; branch two: prices below 50.
named = [(e, v) for e, a, v, _t in db if a == "part/name"]  # => entities with names
# => Branch one: names starting with Road.
by_name = {e for e, v in named if v.startswith("Road")}  # => entity 1
# => Compute the next value.
priced = [(e, v) for e, a, v, _t in db if a == "part/price"]  # => entities with prices
# => Branch two: prices below 50.
by_price = {e for e, v in priced if v < 50}  # => entities 2 and 3
# => Union the branches and print the sorted answer.
answer = sorted(by_name | by_price)  # => deduplicated union
# => The check the lesson quotes.
print("matches:", answer)  # => Output shows the union
