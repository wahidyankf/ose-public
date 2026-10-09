"""Example 36: Default Args."""
# => The two calls show default and explicit name binding.


# name is optional -- falls back to "world" when the caller omits it.
# Defines greet with a default parameter value.
def greet(name: str = "world") -> str:  # => omitted name binds to world at call time
    return f"Hello, {name}"  # => builds and returns the greeting string


print(greet())  # => no argument -- uses the default -- Output: Hello, world
print(greet("Ada"))  # => argument supplied -- Output: Hello, Ada
