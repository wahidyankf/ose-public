# => Example 29 shop package: the shared namespace.
from shop import store  # => WHY absolute: greppable full origin
from shop import pricing  # => every import names its complete path

__all__ = ["store", "pricing"]  # => WHY all: the package surface listed
