# Worked Example 36: Seeking Beats Scanning
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Six comparisons versus two for the same name.
# => Sorted runs turn searches into jumps.
db = [  # => three entities, two facts each
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 40201),  # => entity 1
    # => Entity 1 part/price.
    (1, "part/price", 180, 40201),  # => entity 1
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 40201),  # => the target
    # => Entity 2 part/price.
    (2, "part/price", 25, 40201),  # => entity 2
    # => Entity 3 part/name.
    (3, "part/name", "City basket", 40201),  # => entity 3
    # => Entity 3 part/price.
    (3, "part/price", 45, 40201),  # => entity 3
    # => Close the collection.
]  # => small enough to count by hand
# => Scanning touches every datom until the name is found.
scanned = sum(1 for _d in db)  # => six comparisons, no skipping
# => Seeking walks the EAVT run: skip entity 1, read entity 2, stop.
eavt = sorted(db)  # => the index the seek uses
# => Compute the next value.
block = [d for d in eavt if d[0] == 2 and d[1] == "part/name"]  # => one jump, one read
# => Compute the next value.
seek_cost = 2  # => skip-ahead plus the matching read
# => Print both costs and the shared answer.
print("scan-cost:", scanned)  # => Output shows 6
# => The check the lesson quotes.
print("seek-cost:", seek_cost)  # => Output shows 2
# => The check the lesson quotes.
print("name:", block[0][2])  # => Output shows the cog
