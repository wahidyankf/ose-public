# => Example 42: docstring sessions that execute as tests.
import doctest  # => WHY doctest: docs enforced, not merely written
# => Sessions stay short: every output line is a golden assertion.
# => One error case would pin the rejection; the happy path pins the format.


def slug(title):  # => the documented function: title to slug
    """Slugify a title for URLs.

    >>> slug("Hello World")
    'hello-world'
    """
    return "-".join(title.lower().split())  # => WHY split: runs of space collapse


# => WHY testmod: the docstring session runs as a real test below.
results = doctest.testmod(verbose=False)  # => execute this module sessions
print("tried:", results.attempted)  # => Output: tried: 1, the session ran
print("failed:", results.failed)  # => Output: failed: 0, docs match behavior
print(slug("Hello World"))  # => Output: hello-world, direct call agrees
