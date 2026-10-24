# => Example 78: the switching rules as executable reminders.
# => Debug sessions expand comprehensions: statements beat expressions for prints.
# => Reused streams materialize: lists replay, generators run once.
loop = []  # => the expanded form: debuggable line by line
for n in range(5):  # => a loop that welcomes prints mid-body
    if n % 2 == 0:  # => the condition, inspectable here
        loop.append(n * n)  # => WHY append: clarity wins during debugging
print(loop)  # => Output: [0, 4, 16], expanded without shame
stream = (n for n in range(3))  # => single-use by nature
print(list(stream))  # => Output: [0, 1, 2], first pass consumes
print(list(stream))  # => Output: [], second pass empty: materialize to reuse
kept = list(n for n in range(3))  # => WHY list: reuse needs materializing
print(kept + kept)  # => Output: [0, 1, 2, 0, 1, 2], replays freely
