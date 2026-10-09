"""Example 3: Create Venv Install -- run inside the venv after `pip install pytest`."""
# => The import and printed version must come from the same venv interpreter.

# Resolves ONLY inside the venv's site-packages, not the system Python.
import pytest  # => import resolves pytest from the active environment

# Proves the venv's pip install worked.
print(
    f"pytest {pytest.__version__} importable"
)  # => version text comes from the imported package
# => Output: pytest <installed-version> importable
