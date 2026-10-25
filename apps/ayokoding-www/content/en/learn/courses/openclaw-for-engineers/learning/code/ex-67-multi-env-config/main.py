# => Base plus prod overlay; base never mutates.
# => Prod resolves stricter on two keys.
base = {"sandbox": False, "log": "info", "budget": 50000}  # => shared settings for every environment
# => base has 3 keys (type: dict)
prod = {"sandbox": True, "log": "warn"}  # => prod overlay: stricter on two keys
# => prod has 2 keys (type: dict)
resolved = dict(base)  # => start resolution from the base
# => copy, so base is never mutated
resolved.update(prod)  # => overlay wins on shared keys
# => sandbox and log go strict
print("base sandbox: " + str(base["sandbox"]))  # => Output: base sandbox: False
print("prod sandbox: " + str(resolved["sandbox"]))  # => Output: prod sandbox: True
print("prod log: " + resolved["log"])  # => Output: prod log: warn
print("shared budget: %d" % resolved["budget"])  # => Output: shared budget: 50000
untouched = base == {"sandbox": False, "log": "info", "budget": 50000}  # => base must equal its original value
# => untouched is True
print("base untouched: " + str(untouched))  # => Output: base untouched: True
