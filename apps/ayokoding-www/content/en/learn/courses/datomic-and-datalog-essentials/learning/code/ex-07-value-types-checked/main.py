# Worked Example 7: Types Are Checked at Write Time
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Two good values and two bad ones meet the type checker.
# => Only well-typed values reach the log.
schema = {"part/name": "string", "part/price": "long"}  # => the two slots in play
# => True means stored; False means refused, with the reason kept.
candidates = [  # => four offers, two of each kind
    # => Compute the next value.
    ("part/name", "Road wheel 700c"),  # => a string for a string slot
    # => Compute the next value.
    ("part/price", 180),  # => an integer for an integer slot
    # => Compute the next value.
    ("part/price", 18.5),  # => a float for an integer slot: refused
    # => Compute the next value.
    ("part/name", 700),  # => an integer for a string slot: refused
    # => Close the collection.
]  # => the offers arrive before any datom exists


# => Admit a value only when its Python type matches the slot.
def admits(attr, value):  # => the write-time gate
    # => Strings satisfy string slots; integers satisfy long slots.
    want = schema[attr]  # => the declared type for this slot
    # => Booleans are integers in Python, so they are refused explicitly.
    # => A string value passes a string slot.
    string_ok = want == "string" and isinstance(value, str)  # => name rule
    # => A non-boolean integer passes a long slot.
    long_ok = want == "long" and isinstance(value, int)  # => price rule, booleans out
    # => Either rule passing admits the value, but never a boolean.
    ok = (string_ok or long_ok) and not isinstance(value, bool)  # => the type rule
    # => Hand the answer back.
    return ok  # => True reaches the log, False does not


# => Print one verdict line per candidate value.
for attr, value in candidates:  # => each offer meets the gate
    # => Compute the next value.
    verdict = admits(attr, value)  # => the gate's answer
    # => The check the lesson quotes.
    print(f"{attr}={value!r} admitted={verdict}")  # => Output shows two Trues
