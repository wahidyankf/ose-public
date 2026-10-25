# => Kata 1 starter: failure disguised as data.
def find_price(items, name):  # => returns None when the item is missing
    for item_name, price in items:  # => linear scan over the pairs
        if item_name == name:  # => match returns the price
            return price  # => success path returns a number
    return None  # => failure path returns None: the disguise


catalog = [("lamp", 60), ("chair", 45)]  # => two items on record
print(find_price(catalog, "lamp"))  # => 60: success looks normal
print(find_price(catalog, "desk"))  # => None: failure looks like data
print(find_price(catalog, "desk") + 10)  # => CRASHES: None + 10 raises
