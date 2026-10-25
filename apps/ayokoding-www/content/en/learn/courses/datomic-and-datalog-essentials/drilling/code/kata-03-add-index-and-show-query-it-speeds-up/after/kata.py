# Kata 03 solution: build an EAVT run and count the seek against the scan.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The sorted run turns the search into a block read.
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
# => Sort the datoms into EAVT order.
eavt = sorted(db)  # => entity 1's block, then entity 2's
# => The scan touches everything; the seek reads the block.
scan_cost = len(db)  # => four comparisons
# => Entity 2 owns two of the four datoms in the sorted run.
seek_cost = sum(1 for d in eavt if d[0] == 2)  # => the block size
# => Print both costs.
print("scan-cost:", scan_cost)  # => Output shows 4
# => The check the lesson quotes.
print("seek-cost:", seek_cost)  # => Output shows 2
