# Worked Example 6: Declaring the Schema
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Three attributes: a name, a price, and a set of tags.
# => Each slot declares its value type and its cardinality.
schema = {  # => the schema is ordinary small data
    # => The part/name entry.
    "part/name": {"type": "string", "cardinality": "one"},  # => one name per part
    # => The part/price entry.
    "part/price": {"type": "long", "cardinality": "one"},  # => one price per part
    # => The part/tags entry.
    "part/tags": {"type": "string", "cardinality": "many"},  # => any number of tags
    # => Close the collection.
}  # => three slots, each with two rules
# => Print the attribute count, then each slot with its two rules.
print("attributes:", len(schema))  # => Output counts the slots: 3
# => Walk each candidate in turn.
for name in sorted(schema):  # => sorted for a deterministic print
    # => Compute the next value.
    spec = schema[name]  # => the two rules for this slot
    # => The check the lesson quotes.
    print(
        f"{name} type={spec['type']} cardinality={spec['cardinality']}"
    )  # => Output shows both rules
