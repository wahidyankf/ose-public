# => Example 64 driver: the gate itself, as code.
import py_compile  # => WHY stdlib: the compiler ships with Python

py_compile.compile("sample_mod.py", doraise=True)  # => WHY doraise: fail loudly
print("compiles: True")  # => Output: compiles: True, syntax valid
import sample_mod  # => the compiled module imports normally

print(sample_mod.total([1, 2, 3]))  # => Output: 6, behavior intact
