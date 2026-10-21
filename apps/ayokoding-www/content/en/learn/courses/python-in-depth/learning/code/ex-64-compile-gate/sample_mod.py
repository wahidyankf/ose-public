# => Example 64 fixture: the file the gate compiles.
def total(items):  # => anything syntactically valid passes the gate
    return sum(items)  # => WHY pure: the gate checks syntax, not sense
