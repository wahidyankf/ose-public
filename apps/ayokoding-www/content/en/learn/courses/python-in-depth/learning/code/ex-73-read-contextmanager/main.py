# => Example 73: the yield divides entry from exit.
from contextlib import contextmanager  # => WHY decorator: protocol in one function


@contextmanager  # => setup-yield-teardown becomes a with block
def section(name):  # => the manager: names its bracketed region
    print(f"enter {name}")  # => WHY entry: runs before the body
    try:  # => WHY finally: exit guaranteed past body exceptions
        yield name  # => WHY yield: the body runs here, value binds to as
    finally:  # => exit work survives whatever the body raised
        print(f"exit {name}")  # => runs on success and on failure alike


with section("demo") as label:  # => WHY with: entry and exit bracket this
    print("inside", label)  # => the body between entry and exit
print("after")  # => Output: after, the block completed
