# => Example 75: course idioms composed into a service.
from dataclasses import dataclass  # => WHY record: Example 48 values


@dataclass(frozen=True)  # => items are values: hashable, comparable
class Item:  # => the domain record: sku plus stock
    sku: str  # => identifier: strings compare plainly
    stock: int  # => units held: integers dodge float drift


def sell(item, qty):  # => pure logic over records: Example 45 thinking
    if qty <= 0:  # => WHY guard: Example 16 rejects nonsense first
        raise ValueError("qty must be positive")  # => typed per Example 36
    if item.stock < qty:  # => WHY guard: availability before mutation
        raise ValueError("insufficient stock")  # => distinct failure, same type
    return Item(item.sku, item.stock - qty)  # => WHY new: records evolve by replace


lamp = Item("lamp", 4)  # => four units on hand
print(sell(lamp, 1))  # => Output: Item(sku='lamp', stock=3), evolved record
print(lamp)  # => Output: Item(sku='lamp', stock=4), original frozen
