# => Kata 6 solution: the shape frozen at construction time.
from dataclasses import dataclass  # => WHY dataclass: records without boilerplate


@dataclass(frozen=True)  # => WHY frozen: values, comparable, hashable
class Item:  # => the record with declared fields
    sku: str  # => identifier field, typed
    stock: int  # => count field, typed


lamp = Item("lamp", 4)  # => construction checks the field names
print(lamp.sku)  # => Output: lamp, attribute access documents intent
print(lamp.stock)  # => Output: 4, no string keys to mistype
other = Item("lamp", 4)  # => separately built, equal contents
print(lamp == other)  # => Output: True, values compare by fields
