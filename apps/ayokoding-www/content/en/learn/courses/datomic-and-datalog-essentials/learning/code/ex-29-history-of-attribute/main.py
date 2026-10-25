# Worked Example 29: The Full Life of One Price
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Three prices, one retraction, three printed eras.
# => Retractions close eras; nothing deletes them.
asserts = [  # => every price ever asserted
    # => Compute the next value.
    (180, 30201),  # => the opening price
    # => Compute the next value.
    (175, 30202),  # => the sale, later retracted as a data-entry error
    # => Compute the next value.
    (178, 30204),  # => the corrected price
    # => Close the collection.
]  # => value and opening transaction per era
# => The sale at 30202 was a keying error, retracted at 30203.
retracted_until = {30202: 30203}  # => opening tx to closing tx
# => Print each era with its open and close.
for value, opened in asserts:  # => three eras, oldest first
    # => Compute the next value.
    closed = retracted_until.get(opened, "now")  # => retracted eras name their close
    # => Compute the next value.
    line = f"price={value} opened={opened} closed={closed}"  # => one era per line
    # => The check the lesson quotes.
    print(line)  # => Output replays the life
