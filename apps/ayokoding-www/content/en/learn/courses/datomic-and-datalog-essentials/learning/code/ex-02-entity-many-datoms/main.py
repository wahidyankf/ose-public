# Worked Example 2: One Entity, Many Datoms
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Entity 1 describes one wheel with four datoms in one transaction.
# => Same entity, same transaction, four different attributes.
db = [  # => the fact set starts with one entity's description
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 2001),  # => what the part is called
    # => Entity 1 part/sku.
    (1, "part/sku", "RW-700-32", 2001),  # => the stock-keeping code
    # => Entity 1 part/price.
    (1, "part/price", 180, 2001),  # => whole currency units, never floats
    # => Entity 1 part/in-stock.
    (1, "part/in-stock", 40, 2001),  # => units on the shelf
    # => Close the collection.
]  # => four datoms, one entity, one transaction
# => Count datoms for entity 1 by filtering on the identity position.
count = sum(1 for e, _a, _v, _t in db if e == 1)  # => every datom here belongs to 1
# => Collect the attribute names in sorted order for a stable print.
attrs = sorted(a for e, a, _v, _t in db if e == 1)  # => sorted for determinism
# => Two lines: how many facts, and which slots they fill.
print("datoms:", count)  # => Output counts the facts: 4
# => The check the lesson quotes.
print("attributes:", attrs)  # => Output lists the four slots
