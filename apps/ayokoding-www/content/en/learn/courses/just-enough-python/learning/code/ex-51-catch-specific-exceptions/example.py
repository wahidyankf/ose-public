"""Example 51: Catch Specific Exceptions."""


# Each except clause catches only its own exception type -- order matters when
# exception types overlap via inheritance (not the case here).
def handle(trigger: str) -> str:  # => defines handle, dispatches on the trigger string
    data: dict[str, int] = {"a": 1}  # => data has only key "a" -- "missing" is absent
    try:  # => wraps both risky operations so either exception type can be caught below
        if trigger == "value":  # => branch that deliberately raises ValueError
            int("not a number")  # => nonnumeric text triggers a ValueError
        else:  # => branch that deliberately raises KeyError
            data["missing"]  # => missing dictionary key triggers a KeyError
    except ValueError:  # => catches ONLY ValueError, not KeyError
        return "caught ValueError"  # => runs only for the "value" trigger
    except KeyError:  # => catches ONLY KeyError, not ValueError
        return "caught KeyError"  # => runs only for the other trigger
    return "unreachable"  # => never runs -- one except always returns first


print(handle("value"))  # => Output: caught ValueError
print(handle("key"))  # => Output: caught KeyError
