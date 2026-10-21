# Worked Example 13: Reasserting Builds a Timeline
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Three prices, three eras, one permanent record.
# => Each era opens with an assert and closes with a retract.
asserts = [  # => every price the wheel ever carried
    # => Entity 1 part/price.
    (1, "part/price", 180, 9101),  # => the opening price
    # => Entity 1 part/price.
    (1, "part/price", 175, 9102),  # => the sale price
    # => Entity 1 part/price.
    (1, "part/price", 185, 9103),  # => the restored price
    # => Close the collection.
]  # => three eras, newest last
# => An era runs from its assert transaction to the next assert.
eras = []  # => the timeline builds here
# => Walk each candidate in turn.
for i in range(len(asserts)):  # => oldest era first
    # => Compute the next value.
    opened = asserts[i][3]  # => this era's opening tx
    # => Compute the next value.
    price = asserts[i][2]  # => this era's price
    # => Compute the next value.
    closed = asserts[i + 1][3] if i + 1 < len(asserts) else "now"  # => next era ends it
    # => Record the result.
    eras.append((opened, price, closed))  # => one era recorded
# => Print one line per era: price, opened at, closed at.
for opened, price, closed in eras:  # => three eras, oldest first
    # => Compute the next value.
    line = f"price={price} opened={opened} closed={closed}"  # => one era per line
    # => The check the lesson quotes.
    print(line)  # => Output shows the timeline
