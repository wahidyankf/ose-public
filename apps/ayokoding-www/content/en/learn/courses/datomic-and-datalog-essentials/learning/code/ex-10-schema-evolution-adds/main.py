# Worked Example 10: New Attributes Arrive Without Migration
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Origin tracking starts mid-year; old facts are untouched.
# => Evolution is addition, never alteration.
schema = {"part/name": "one", "part/price": "one"}  # => the original two slots
# => The warehouse asks for origin tracking in transaction 7001.
schema["part/origin"] = "one"  # => a third slot joins the map
# => Old datoms keep working; new datoms use the new slot.
db = [  # => facts from before and after the schema change
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 6001),  # => written before origin existed
    # => Entity 1 part/origin.
    (1, "part/origin", "ID", 7001),  # => the first origin fact
    # => Entity 2 part/origin.
    (2, "part/origin", "TW", 7001),  # => a second part gains an origin
    # => Close the collection.
]  # => mixed eras, one happy store
# => Print the schema size and the facts that predate the new slot.
old = [d for d in db if d[3] < 7001]  # => facts from before the change
# => The check the lesson quotes.
print("attributes:", len(schema))  # => Output counts 3 slots
# => The check the lesson quotes.
print("predating-facts:", len(old))  # => Output shows 1 untouched fact
# => The check the lesson quotes.
print(
    "origins:", sorted(v for _e, a, v, _t in db if a == "part/origin")
)  # => Output shows both origins
