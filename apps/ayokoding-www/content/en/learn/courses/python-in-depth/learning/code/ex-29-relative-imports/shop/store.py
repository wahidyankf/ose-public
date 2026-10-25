# => Example 29 store module: stock lookups live here.
STOCK = {"lamp": 4, "chair": 0}  # => the inventory both modules share


def available(name):  # => stock check with zero meaning gone
    return STOCK.get(name, 0) > 0  # => WHY get: missing means none
