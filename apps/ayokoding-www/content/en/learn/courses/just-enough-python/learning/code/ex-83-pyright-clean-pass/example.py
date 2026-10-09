"""Example 83: a fully type-annotated module -- pyright-clean."""

# => Four widgets at 2.5 each total 10.00.


# A fully typed pure function -- unit_price, quantity, and the return are all annotated.
def total_price(unit_price: float, quantity: int) -> float:  # => returns float
    return unit_price * quantity  # => float * int -- Python promotes to float


# Builds a one-line summary string from three typed arguments.
def describe(name: str, price: float, quantity: int) -> str:  # => summary text
    # Every local has an explicit annotation.
    total: float = total_price(price, quantity)  # => calls the function above
    return f"{quantity}x {name} = {total:.2f}"  # => formats total to 2 decimal places


print(describe("widget", 2.5, 4))  # => Output: 4x widget = 10.00
# => Run: pyright example.py -- Output: 0 errors, 0 warnings, 0 informations
