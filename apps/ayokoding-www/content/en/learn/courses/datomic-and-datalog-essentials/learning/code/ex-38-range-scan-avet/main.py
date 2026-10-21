# Worked Example 38: Range Scans Ride Value Order
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Four prices, one band, two winners.
# => Value order makes ranges contiguous.
db = [  # => four priced parts
    # => Entity 1 part/price.
    (1, "part/price", 180, 40401),  # => inside the band
    # => Entity 2 part/price.
    (2, "part/price", 25, 40401),  # => below the band
    # => Entity 3 part/price.
    (3, "part/price", 60, 40401),  # => inside the band
    # => Entity 4 part/price.
    (4, "part/price", 320, 40401),  # => above the band
    # => Close the collection.
]  # => the band is 50 to 200 inclusive
# => AVET order sorts prices first for this attribute.
by_value = sorted((v, e) for e, a, v, _t in db if a == "part/price")  # => value-led run
# => Slice the run to the band edges.
band = [(v, e) for v, e in by_value if 50 <= v <= 200]  # => two survivors
# => Print the band contents.
print("in-band:", band)  # => Output shows the two winners
