# => Kata 1 solution: failure raises, typed and loud.
class UnknownItem(LookupError):  # => WHY domain: callers catch exactly this
    pass  # => the type carries the meaning


def find_price(items, name):  # => raises instead of returning None
    for item_name, price in items:  # => same scan, honest failure mode
        if item_name == name:  # => match still returns the price
            return price  # => success unchanged: numbers out
    raise UnknownItem(name)  # => WHY raise: misuse fails at the call site


catalog = [("lamp", 60), ("chair", 45)]  # => two items on record
print(find_price(catalog, "lamp"))  # => Output: 60, success unchanged
try:  # => the failure path, handled by the caller
    find_price(catalog, "desk")  # => raises: no silent None anymore
except UnknownItem as err:  # => typed catch: the contract proven
    print("unknown:", err)  # => Output: unknown: desk
