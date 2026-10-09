"""Example 42: Scope, global and local."""
# => Two calls move the shared total from 0 to 12.

# Without `global`, assigning to a name inside a function creates a LOCAL shadow.
total: int = 0  # => a module-level (global) variable


# Defines a function that mutates the global total.
def add_to_total(amount: int) -> None:  # => amount is added to the module-level total
    global total  # => without this, `total += amount` would raise UnboundLocalError
    total += amount  # => mutates the GLOBAL total, not a local shadow of it


add_to_total(5)  # => total is now 5
add_to_total(7)  # => total is now 12
print(total)  # => 0+5+7 -- Output: 12
