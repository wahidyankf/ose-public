# => Kata 8 starter: diagnostics pollute the result stream.
def total(items):  # => pure function with chatty prints
    print("computing...")  # => diagnostic on stdout: pollutes results
    result = sum(items)  # => the actual work, one line
    print(f"got {result}")  # => second diagnostic mixed with data
    return result  # => callers parsing stdout see three lines


print(total([1, 2]))  # => three lines where one belongs
