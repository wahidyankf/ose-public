# => Example 29 pricing module: sibling reached by dot.
from .store import STOCK  # => WHY relative: siblings move as one unit

PRICES = {"lamp": 60, "chair": 45}  # => the price list beside stock


def quote(name):  # => price only when stock exists
    if name not in STOCK or STOCK[name] <= 0:  # => WHY guard: no price for gone
        return "unavailable"  # => fixed label for missing stock
    return PRICES[name]  # => plain lookup: presence already proven
