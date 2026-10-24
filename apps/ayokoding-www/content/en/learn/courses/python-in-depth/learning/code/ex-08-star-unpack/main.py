# => Example 8: star targets name each part of a sequence.
row = ["2026-10-21", "deploy", "ok", "1.2.3"]  # => a log row: fixed edges, open middle
date, action, *details = row  # => WHY star: middle absorbs any field count
print(date, action)  # => Output: 2026-10-21 deploy, edges named
print(details)  # => Output: ['ok', '1.2.3'], middle kept whole
first, *rest = [1, 2, 3, 4]  # => head plus everything after it
print(first, rest)  # => Output: 1 [2, 3, 4]


def add(a, b):  # => a two-argument function to call by star
    return a + b  # => plain addition: the forwarding is the point


args = [3, 4]  # => arguments stored as data, forwarded by star
print(add(*args))  # => Output: 7, call built from a list
merged = [0, *args, 5]  # => WHY star in a literal: splice without plus
print(merged)  # => Output: [0, 3, 4, 5]
