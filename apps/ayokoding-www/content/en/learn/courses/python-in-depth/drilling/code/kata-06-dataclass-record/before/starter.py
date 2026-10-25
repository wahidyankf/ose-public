# => Kata 6 starter: dicts accept typos silently.
def make_item(sku, stock):  # => dict factory with string keys
    return {"sku": sku, "stock": stock}  # => any key goes, typos included


lamp = make_item("lamp", 4)  # => correct construction
print(lamp["stok"])  # => CRASHES: typo key raises KeyError at use
