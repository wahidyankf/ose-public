# Kata 03 starter: build an EAVT run and count the seek against the scan.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Fill the index, then compare both costs.
db = [  # => two entities, two facts each
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 70301),  # => entity 1
    # => Entity 1 part/price.
    (1, "part/price", 180, 70301),  # => entity 1
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 70301),  # => entity 2
    # => Entity 2 part/price.
    (2, "part/price", 25, 70301),  # => entity 2
    # => Close the collection.
]  # => four facts, one target entity
# => TODO: sort the datoms into EAVT order.
eavt = list(db)  # => TODO: replace with sorted(db)
# => The scan touches everything; the seek reads the block.
scan_cost = len(db)  # => four comparisons
# => TODO: count only entity 2's block in the sorted run.
seek_cost = len(db)  # => TODO: replace with the block size
# => Print both costs.
print("scan-cost:", scan_cost)  # => Output shows 4
# => The check the lesson quotes.
print("seek-cost:", seek_cost)  # => Output shows 2 after the fix
