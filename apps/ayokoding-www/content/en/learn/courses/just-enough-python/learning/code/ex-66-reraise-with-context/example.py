"""Example 66: Re-raise With Context (`raise ... from err`)."""
# => The uncaught traceback retains the original conversion failure.


# Defines load_config, which converts raw or raises with the original error chained.
def load_config(raw: str) -> int:  # => conversion returns an int or raises
    try:  # => wraps the conversion so a ValueError can be re-raised as a RuntimeError
        return int(raw)  # => raises ValueError here when raw isn't numeric
    except ValueError as err:  # => catches the ORIGINAL exception to chain it below
        raise RuntimeError(
            "config value must be an integer"
        ) from err  # => new RuntimeError retains the ValueError as its cause
        # => `from err` chains the ORIGINAL exception into the new one's traceback


# The uncaught exception below propagates all the way to the interpreter.
load_config("not-a-number")  # => uncaught -- traceback shows BOTH exceptions, in order
