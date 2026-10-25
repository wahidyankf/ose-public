# => Example 3: enumerate pairs each item with its number.
tasks = ["write", "test", "review"]  # => the list drives the loop, named once
for number, task in enumerate(tasks, start=1):  # => WHY enumerate: pair arrives whole
    print(number, task)  # => Output: 1 write / 2 test / 3 review, one-based
indexed = list(enumerate(tasks))  # => pairs materialized: index plus item
print(indexed[0])  # => Output: (0, 'write'), zero-based default shown
for i in range(len(tasks)):  # => the translation to avoid: index arithmetic
    print("avoid:", tasks[i])  # => same items, triple naming of the list
