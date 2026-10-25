# => Example 69: the C loop beats per-item method calls.
source = range(20)  # => fixed input both forms transform
comp = [n * n for n in source if n % 2 == 0]  # => WHY comprehension: C-speed loop
print(comp)  # => Output: [0, 4, 16, 36, 64, 100, 144, 196, 256, 324]
acc = []  # => the accumulator form for comparison
for n in source:  # => bytecode loop with per-item dispatch
    if n % 2 == 0:  # => same condition, separate line
        acc.append(n * n)  # => WHY slower: method call per item
print(acc == comp)  # => Output: True, same result, different cost
print(len(comp))  # => Output: 10, half of twenty kept
