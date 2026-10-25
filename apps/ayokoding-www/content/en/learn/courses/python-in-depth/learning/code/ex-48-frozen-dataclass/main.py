# => Example 48: frozen records compare by content, hash stably.
from dataclasses import dataclass  # => WHY dataclass: records without boilerplate


@dataclass(frozen=True)  # => WHY frozen: values, never mutated in place
class Money:  # => the domain value: amount plus currency
    amount: int  # => minor units: integers dodge float drift
    currency: str  # => the unit the amount is denominated in


a = Money(500, "USD")  # => five dollars as an immutable record
b = Money(500, "USD")  # => separately built, identical contents
print(a == b)  # => Output: True, equality by fields not identity
print(a is b)  # => Output: False, distinct objects, equal values
print(len({a, b}))  # => Output: 1, hashing dedupes equal values
print(hash(a) == hash(b))  # => Output: True, equal values hash alike
