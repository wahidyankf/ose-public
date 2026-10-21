# => Example 5: one expression replaces the accumulator loop.
scores = [98, 55, 100, 61]  # => raw input both forms transform
passed = [s for s in scores if s >= 60]  # => WHY comprehension: filter plus keep
print(passed)  # => Output: [98, 100, 61], one line, no append
grades = ["pass" if s >= 60 else "fail" for s in scores]  # => mapping with branches
print(grades)  # => Output: ['pass', 'fail', 'pass', 'fail']
built = []  # => the accumulator form: same result, four lines
for s in scores:  # => explicit loop the comprehension replaces
    if s >= 60:  # => condition repeated away from the result
        built.append(s)  # => WHY slower: method call per item in bytecode
print(built == passed)  # => Output: True, forms agree, style differs
