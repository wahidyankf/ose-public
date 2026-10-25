# => Example 17: one group carries every independent failure.
def check_age(value):  # => each validator raises its own kind
    if not isinstance(value, int):  # => wrong type is a TypeError
        raise TypeError("age type")  # => typed: dispatchable by except*
    if value < 0:  # => impossible value is a ValueError
        raise ValueError("age range")  # => typed: a different handler


errors = []  # => collectors gather failures instead of raising first
for candidate in ["old", -1]:  # => two bad values, two kinds
    try:  # => each candidate validated independently
        check_age(candidate)  # => raises per candidate, collected below
    except (TypeError, ValueError) as err:  # => WHY tuple: both kinds collected
        errors.append(err)  # => kept, not raised: the loop continues
group = ExceptionGroup("form", errors)  # => WHY group: report all at once
try:  # => handlers dispatch by type inside the bundle
    raise group  # => the bundle travels as one exception
except* TypeError:  # => WHY star: matches members, not the group
    print("type problem found")  # => Output: type problem found
except* ValueError:  # => second kind handled separately
    print("range problem found")  # => Output: range problem found
