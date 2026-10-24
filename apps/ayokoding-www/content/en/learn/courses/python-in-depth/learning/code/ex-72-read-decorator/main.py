# => Example 72: wrapper first, wrapped function second.
import functools  # => WHY wraps: decorated functions keep their names


def require_args(func):  # => the decorator: checks, then delegates
    @functools.wraps(func)  # => WHY wraps: name and docs survive wrapping
    def wrapper(*args):  # => accepts any call shape, checks one rule
        if not args:  # => WHY check: the orthogonal concern, stated once
            raise ValueError("needs arguments")  # => rejection before delegating
        return func(*args)  # => WHY delegate: the wrapped logic runs here

    return wrapper  # => WHY rebind: the name now means the wrapper


@require_args  # => greet = require_args(greet): the hidden call
def greet(name):  # => the wrapped logic: trivial on purpose
    return f"hello, {name}"  # => runs only after the check passes


print(greet("ada"))  # => Output: hello, ada, check passed, logic ran
print(greet.__name__)  # => Output: greet, wraps preserved the name
try:  # => the rejection path demonstrated safely
    greet()  # => no arguments: the wrapper refuses
except ValueError:  # => typed per the decorator contract
    print("refused empty call")  # => Output: refused empty call
