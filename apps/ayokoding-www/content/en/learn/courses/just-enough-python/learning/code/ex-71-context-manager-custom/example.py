"""Example 71: Custom Context Manager (__enter__/__exit__)."""

# => Normal block exit calls exit after the body print.

# Imports the type used to annotate __exit__'s traceback argument.
from types import TracebackType  # => types the optional traceback argument


class Session:  # => defines a class implementing the context-manager protocol
    def __enter__(self) -> "Session":  # => runs when the `with` block is entered
        print("enter")  # => Output line 1: enter
        return self  # => becomes the `as` target, if one is written

    # Runs when the `with` block exits, whether normally or via an exception.
    # All three exception args are None below, since the body raises nothing.
    def __exit__(  # => exit receives exception details after the body
        self,  # => the instance itself, bound automatically like any other method
        exc_type: type[BaseException] | None,  # => exception class, or None if no error
        exc_value: BaseException | None,  # => exception instance, or None if no error
        traceback: TracebackType | None,  # => traceback object, or None if no error
    ) -> None:  # => returning None (falsy) means: don't suppress the exception
        print("exit")  # => runs on the way out -- Output line 3: exit, even on error


with Session():  # => calls __enter__() on entry, __exit__() on exit -- guaranteed
    print("body")  # => Output line 2: body -- runs between enter and exit
