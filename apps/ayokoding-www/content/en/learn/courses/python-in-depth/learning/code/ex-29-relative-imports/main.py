# => Example 29 driver: absolute imports from outside.
from shop.store import available  # => WHY absolute: full origin visible
from shop.pricing import quote  # => cross-module use stays explicit

print(available("lamp"))  # => Output: True, four in stock
print(available("chair"))  # => Output: False, zero means gone
print(quote("chair"))  # => Output: unavailable, stock gates price
print(quote("lamp"))  # => Output: 60, present and priced
