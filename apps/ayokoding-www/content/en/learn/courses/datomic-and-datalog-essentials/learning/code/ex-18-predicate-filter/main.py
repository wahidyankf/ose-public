# Worked Example 18: Predicates Filter Bindings
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Four parts, one threshold, two survivors.
# => Patterns bind; predicates decide.
db = [  # => four priced parts in one transaction
    # => Entity 1 part/price.
    (1, "part/price", 180, 10301),  # => above the line
    # => Entity 2 part/price.
    (2, "part/price", 25, 10301),  # => below the line
    # => Entity 3 part/price.
    (3, "part/price", 60, 10301),  # => below the line
    # => Entity 4 part/price.
    (4, "part/price", 320, 10301),  # => above the line
    # => Close the collection.
]  # => the candidates
# => Name each part for the final print.
catalog = [(1, "Road wheel 700c"), (2, "Track cog 16t")]  # => first pair
# => The second pair joins the catalog.
catalog += [(3, "City basket"), (4, "E-bike motor")]  # => second pair
# => An entity-to-name map serves the projection.
names = dict(catalog)  # => entity to name
# => Keep bindings whose price clears the threshold, priciest first.
priced = [(e, v) for e, a, v, _t in db if a == "part/price"]  # => every price
# => Keep bindings that clear the threshold.
premium = [(names[e], v) for e, v in priced if v > 100]  # => above the line
# => Priciest first for the final print.
premium.sort(key=lambda r: -r[1])  # => the filter
# => Print one line per surviving part.
for name, price in premium:  # => two premium parts
    # => The check the lesson quotes.
    print(f"part={name} price={price}")  # => Output shows the survivors
