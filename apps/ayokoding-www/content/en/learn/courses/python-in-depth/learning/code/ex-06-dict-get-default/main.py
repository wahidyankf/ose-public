# => Example 6: get carries the absent-key policy with the lookup.
words = ["ada", "grace", "ada"]  # => input with a repeated word to count
counts = {}  # => the frequency table, built one lookup at a time
for word in words:  # => each word increments its own counter
    counts[word] = counts.get(word, 0) + 1  # => WHY get: missing means zero
print(counts)  # => Output: {'ada': 2, 'grace': 1}
options = {"retries": 3}  # => sparse config: one key set, one missing
print(options.get("retries", 1))  # => Output: 3, present key wins
print(options.get("timeout", 30))  # => Output: 30, default fills the gap
