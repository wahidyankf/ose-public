# Worked Example 37: Every Index Is Paid at Write Time
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One datom, four filings, four runs of length one.
# => Reads are cheap because writes pay first.
datom = (1, "part/price", 175, 40301)  # => the single new fact
# => Four orderings over the same one datom.
eavt = sorted([datom])  # => entity-led run
# => Compute the next value.
aevt = sorted([datom], key=lambda d: (d[1], d[0], d[2], d[3]))  # => attribute-led run
# => Compute the next value.
avet = sorted([datom], key=lambda d: (d[1], d[2], d[0], d[3]))  # => attribute-value run
# => Compute the next value.
vaet = sorted([datom], key=lambda d: (d[2], d[0], d[1], d[3]))  # => value-led run
# => Print the size of each run: one filing each.
print("eavt:", len(eavt))  # => Output shows 1
# => The check the lesson quotes.
print("aevt:", len(aevt))  # => Output shows 1
# => The check the lesson quotes.
print("avet:", len(avet))  # => Output shows 1
# => The check the lesson quotes.
print("vaet:", len(vaet))  # => Output shows 1
